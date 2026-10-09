/**
 * The session table: one `EdgeAccount` per logged-in session.
 *
 * A `sessionId` is a bearer token — `getSession` does a map lookup and an
 * expiry test and nothing else — so everything here treats it as one: it is
 * redacted in events and logs, truncated in the public listing, and the
 * auto-logout window is the user's own synced setting, re-read on each sweep
 * and never silently replaced by a default.
 *
 * It also owns the teardown order, which is load-bearing: close the
 * session's subscriptions, *wait* for the session's other requests, release
 * the object handles it owned, log the account out, emit, then clear the
 * process caches.
 *
 * The wait comes before the release because a handle whose call is in flight
 * is released out from under that call otherwise — `deleteMany` then waits
 * its own bounded window and abandons it, which `hold` has to clean up. And
 * `account.logout()` comes after the release, not before: it is what
 * invalidates a live swap quote or a signed transaction, so a handle that
 * outlives it has nothing able to release it. Both orderings were inverted
 * at some point and both inversions survived because this list did not say
 * which way round they go.
 */
import crypto from 'crypto'
import type { EdgeAccount } from 'edge-core-js'

import { base58 } from '../../util/encoding'
import { clearRateCache } from '../../util/exchangeRates'
import type { PeriodicTask } from '../../util/PeriodicTask'
import {
  readSyncedSettings,
  readSyncedSettingsOrThrow
} from '../../util/syncedSettingsFile'
import { withDeadline } from '../../util/withDeadline'
import { engineError, errorMessage } from './errors'
import type { EventHub } from './events'
import { consoleReporter, type EngineReporter } from './logger'
import type { ObjectHandleStore } from './objectHandles'
import type { asLoginMethod, asSession } from './schemas'
import {
  CORE_TEARDOWN_WAIT_MS,
  drainToFloor,
  LOGOUT_WAIT_MS
} from './shutdownTiming'
import { makeSweepTicker } from './sweepTicker'

/**
 * How often a session with auto-logout *off* re-reads the synced setting.
 *
 * Once a minute against the ticker's 15 seconds: a quarter of the reads, and
 * a user who re-enables auto-logout on their phone sees it on a live session
 * within a minute rather than never. Slower because `isExpired` answers
 * false for `0` before it looks at a window and the read is a decrypt plus a
 * parse with no cache — but not skipped, which made `0` a one-way latch.
 *
 * Exported for `derivedNumbers.test.ts`, which holds `docs/EDGE_CLI.md`'s
 * two published numbers to this and to `SWEEP_INTERVAL_MS`. Nothing else
 * can: driving the re-read live needs a second writer of the account's
 * synced `Settings.json`, and no CLI route writes that file.
 */
export const DISABLED_RECHECK_MS = 60_000

/**
 * Derived from the response cleaner, not restated beside it.
 *
 * The same six values were declared twice, independently, in a different
 * order: this type is what `create` accepts, and `asLoginMethod` is what the
 * published `asSession` enforces. A seventh added to the type alone made the
 * engine answer with a value its own `returns` cleaner rejects — a 500 under
 * `EDGE_CLI_CHECK_RESPONSES=strict`, which the fake suite runs in — and one
 * added to the cleaner alone published a value nothing can return.
 */
type LoginMethod = ReturnType<typeof asLoginMethod>

/**
 * A session as `engine-sessions` publishes it: the id is truncated.
 *
 * `sessionId` is branded, so this is a genuinely distinct type and not — as
 * it was — `Omit<SessionInfo, 'sessionId'> & { sessionId: string }`, which
 * restates the field at the type it already had and is therefore
 * structurally identical to `SessionInfo`. What the compiler now refuses is
 * the direction that leaks: a `SessionInfo`, or any plain string, cannot be
 * used as a listing, so the only way to build one is through
 * `redactSessionId`. The other direction still widens to `string`, because a
 * brand is `string & …`, so the remaining rule is a convention: `list()` is
 * the only redaction point and nothing reads an id back out of a listing.
 */
interface SessionListing extends Omit<SessionInfo, 'sessionId'> {
  sessionId: RedactedSessionId
}

/**
 * The session shape the engine publishes, from the cleaner that enforces it.
 *
 * `asSession` is the declaration: six routes name it as their `returns`,
 * `checkResponse` runs it on every reply, and the client cleans its own copy
 * with it. This restated all eight fields with the same cleaners' types, in
 * the same order, guarded by nothing — the mistake `LoginMethod` ten lines
 * above was fixed for, where "a seventh added to the type alone made the
 * engine answer with a value its own `returns` cleaner rejects".
 */
export type SessionInfo = ReturnType<typeof asSession>

export interface SessionRecord {
  sessionId: string
  account: EdgeAccount
  loginMethod: LoginMethod
  autoLogoutSeconds: number
  /**
   * When the synced setting was last re-read for this session.
   *
   * Only a session with auto-logout *off* consults it. Those are re-read on
   * a slower cadence than the ticker runs at, because the read is a decrypt
   * plus a parse on core's synced disklet with no cache, and `isExpired`
   * answers false for `0` before it looks at a clock — so re-reading 240
   * times an hour buys nothing. Not re-reading at all was worse: see `tick`.
   */
  lastSettingReadAt: number
  lastActivityAt: number
  createdAt: number
  /**
   * Requests being served against this session right now.
   *
   * `lastActivityAt` records only when a request *started*, so a call that
   * outlives the auto-logout window — a cold `wait-for-all-wallets`, a
   * `resync-blockchain`, a `spend` on a congested chain — would otherwise be
   * logged out from underneath itself, exactly the failure `IdleShutdown`
   * counts in-flight requests to avoid.
   */
  inFlight: number
}

function makeSessionId(): string {
  const bytes = crypto.randomBytes(16)
  return 'sess_' + base58.stringify(bytes)
}

/**
 * The account's auto-logout setting.
 *
 * Read through `asSyncedSettingsSubset`, a two-field view of the same
 * `Settings.json` the GUI writes. Not the GUI's own `asSyncedAccountSettings`
 * — that lives in `actions/SettingsActions`, which imports Airship, so the
 * engine cannot load it. `syncedSettingsFile.test.ts` asserts the subset's
 * defaults still match the GUI cleaner's, which is the drift that would matter.
 */
async function readAutoLogoutSeconds(account: EdgeAccount): Promise<number> {
  const { autoLogoutTimeInSeconds } = await readSyncedSettings(account)
  return autoLogoutTimeInSeconds
}

/**
 * The same read, letting a failure out so the ticker can keep what it has.
 *
 * Auto-logout is a security control, and the window is the user's choice:
 * substituting the cleaner's 3600 on a transient read failure logs out an
 * account that set `0` to disable it, and reports the substituted value
 * through `engine-sessions` as if the user had chosen it.
 */
async function reReadAutoLogoutSeconds(account: EdgeAccount): Promise<number> {
  const { autoLogoutTimeInSeconds } = await readSyncedSettingsOrThrow(account)
  return autoLogoutTimeInSeconds
}

/**
 * A session id as it is safe to print or publish.
 *
 * A `sessionId` is a bearer token: `getSession` does a map lookup and an
 * expiry test and nothing else, so holding one is full account authority —
 * `get-raw-private-key`, `get-pin`, `get-login-key` and `spend` take nothing
 * more. Event payloads and log lines therefore carry only enough of it to
 * correlate, and it was spelled out at four call sites, which is three too
 * many for a redaction.
 */
export function redactSessionId(sessionId: string): RedactedSessionId {
  return (sessionId.slice(0, 10) + '\u2026') as RedactedSessionId
}

/**
 * A `string` that only `redactSessionId` can produce.
 *
 * The brand exists at compile time only — the runtime value is the truncated
 * string — but it is what makes `SessionListing` a distinct type. Without it
 * `Omit<SessionInfo, 'sessionId'> & { sessionId: string }` was structurally
 * identical to `SessionInfo`, so TypeScript assigned either to the other
 * silently and the claim below was false: the whole guard against re-leaking
 * a full id rested on `list()` remembering to call this.
 */
export type RedactedSessionId = string & {
  readonly __redacted: unique symbol
}

export class SessionStore {
  private readonly sessions = new Map<string, SessionRecord>()
  private ticker: PeriodicTask | null = null
  private readonly events: EventHub

  /** Notified whenever the number of live sessions changes. */
  onSessionsChanged: (() => void) | null = null

  /**
   * The handle store, so a logout can release what the session owned.
   *
   * Set after construction because the two stores are peers: the engine
   * builds the handle store with an `onExpire` that can reach sessions.
   */
  objects: ObjectHandleStore | null = null

  private readonly report: EngineReporter

  constructor(events: EventHub, report: EngineReporter = consoleReporter) {
    this.events = events
    this.report = report
  }

  private sessionsChanged(): void {
    try {
      this.onSessionsChanged?.()
    } catch {
      // A listener must never break login/logout.
    }
  }

  get size(): number {
    return this.sessions.size
  }

  /**
   * Every live session, with the ids redacted.
   *
   * `engine-sessions` needs no session of its own, because it is a
   * diagnostic. Returning the full `sessionId` made it a credential
   * dispenser: one unauthenticated call turned a reachable TCP port into
   * account authority over every account the engine had open, and
   * `get-login-key` turns that into a permanent one. A caller entitled to a
   * session id already has it, from its own login response or from the
   * `0600` session file.
   */
  list(): SessionListing[] {
    return [...this.sessions.values()].map(r => ({
      ...this.toInfo(r),
      sessionId: redactSessionId(r.sessionId)
    }))
  }

  async create(
    account: EdgeAccount,
    loginMethod: LoginMethod
  ): Promise<SessionInfo> {
    // edge-core-js resolves login from inside the account pixie's first
    // update(), then returns stopUpdates. createCurrencyWallet's internal
    // waitForCurrencyWallet throws if the new wallet id is missing from
    // Redux, so a same-turn create after login never lands the keys.
    // Drain the pixie stack before exposing the session so POST /wallets
    // is safe immediately. waitForAllWallets is a no-op on empty accounts.
    await new Promise<void>(resolve => {
      setImmediate(resolve)
    })
    await account.waitForAllWallets()

    const sessionId = makeSessionId()
    const autoLogoutSeconds = await readAutoLogoutSeconds(account)
    const now = Date.now()
    const record: SessionRecord = {
      sessionId,
      account,
      loginMethod,
      autoLogoutSeconds,
      lastSettingReadAt: now,
      lastActivityAt: now,
      createdAt: now,
      inFlight: 0
    }
    this.sessions.set(sessionId, record)
    this.sessionsChanged()
    // Scoped, so `scopeMatches` actually runs. Without a scope this went
    // to every subscriber, so a stream opened against account A received
    // account B's username and session prefix through an API whose own prose
    // calls it account-scoped.
    this.events.emit(
      'session.created',
      {
        sessionId: redactSessionId(sessionId),
        username: account.username,
        loginMethod
      },
      { kind: 'session', sessionId }
    )
    return this.toInfo(record)
  }

  get(sessionId: string): SessionRecord {
    const record = this.sessions.get(sessionId)
    if (record == null) {
      throw engineError('INVALID_SESSION', 'Unknown sessionId', 401)
    }
    // `forSweep`, because a call already in flight must not have its account
    // torn down underneath it — which is what this counter is for.
    if (this.isExpired(record, { forSweep: true })) {
      // Logged, not discarded: `forceLogout` closes this session's
      // subscriptions and releases its object handles, and for a swap that
      // means closing the order at the exchange. A failure there is worth a
      // line — which is the reason `makeSweepTicker` has an `onError` at
      // all.
      this.forceLogout(sessionId, 'expired').catch((error: unknown) => {
        const message = errorMessage(error)
        this.report.warn(
          `auto-logout of ${redactSessionId(sessionId)} failed: ${message}`
        )
      })
      throw engineError('SESSION_EXPIRED', 'Session auto-logged out', 401)
    }
    return record
  }

  /**
   * The session's current state, or null when the store no longer holds it.
   *
   * Non-throwing, for callers that are reporting on a session rather than
   * acting on one: a pending-login summary has to be able to say "the session
   * this login created is gone" instead of failing the request.
   */
  peek(sessionId: string): SessionInfo | null {
    const record = this.sessions.get(sessionId)
    if (record == null) return null
    if (this.isExpired(record, { forSweep: true })) return null
    return this.toInfo(record)
  }

  touch(sessionId: string): SessionInfo {
    const record = this.get(sessionId)
    record.lastActivityAt = Date.now()
    return this.toInfo(record)
  }

  /**
   * Log out at the caller's request.
   *
   * The only difference from `forceLogout` is that an unknown session is an
   * error here, because the caller named one. The teardown itself is shared:
   * it was written out twice in the same order, and had already begun to
   * drift — one copy carried the comment explaining why `closeScope` runs
   * and the other did not — so a change to the order, which this branch made
   * twice, had to be made in both or a logout and an auto-logout released
   * different things.
   */
  async logout(sessionId: string): Promise<void> {
    if (!this.sessions.has(sessionId)) {
      throw engineError('INVALID_SESSION', 'Unknown sessionId', 401)
    }
    // The request serving this logout is itself in flight against this
    // session, so the wait below has to discount it or it deadlocks on
    // itself. The ticker, `shutdown` and the two `cancelled` callers hold
    // nothing: those tear down a session freshly created for a pending edge
    // login, which no request is running against.
    await this.forceLogout(sessionId, 'logout', { ownRequests: 1 })
  }

  async forceLogout(
    sessionId: string,
    reason: 'expired' | 'shutdown' | 'cancelled' | 'logout',
    opts: { ownRequests?: number } = {}
  ): Promise<void> {
    const record = this.sessions.get(sessionId)
    if (record == null) return
    this.sessions.delete(sessionId)
    this.sessionsChanged()
    // Before the account goes, which is the order this class says it owns.
    // Both of these reach things the account owns — a live swap quote, a
    // signed transaction — and `account.logout()` invalidates every one of
    // them, so tearing the account down first produced exactly the state the
    // class comment warns about and left the bounded wait in `deleteMany`
    // protecting the ordering of `quote.close()` against an account that was
    // already gone.
    this.events.closeScope(sessionId, reason)
    // Drained *before* the handles are released, not after. `deleteMany`
    // gives the `consuming` handles `HANDLE_BUSY_WAIT_MS` (10 s) between
    // them — one absolute deadline for the whole release, not 10 s each —
    // and then abandons whatever is still in a call, "left in place", while
    // this wait allows the request holding one `LOGOUT_WAIT_MS` (30 s). Releasing first therefore gave up
    // on the handle twenty seconds before the request that owned it
    // finished, and `hold`'s `finally` pushed its TTL out again, so a
    // `broadcast-tx` on a congested chain left a signed-transaction or
    // swap-quote handle in the store with a fresh lease and its account
    // about to disappear. Once nothing is in flight, nothing is
    // `consuming`, so the release is not abandoned — and when this wait does
    // time out, `deleteMany` marks what it walked away from and `hold`
    // releases it when the call finally returns, rather than re-arming a
    // handle whose session is gone.
    await this.waitForQuiet(record, sessionId, opts.ownRequests ?? 0)
    await this.releaseHandles(sessionId)
    try {
      // Bounded: core's own logout has no ceiling, and an account that never
      // settles here is an engine that never exits — it holds the socket,
      // the run file and the profile, and the next invocation then reports
      // "An engine is already running" with nothing a user can do about it.
      await withDeadline(
        record.account.logout(),
        CORE_TEARDOWN_WAIT_MS,
        `logging ${redactSessionId(sessionId)} out did not finish`
      )
    } catch (error: unknown) {
      // Reported, not passed over. The record left the map at the top of
      // this method, so nothing can retry this: `logout` answers
      // `INVALID_SESSION` and no route reaches the account again. An
      // `EdgeAccount` that failed to log out keeps its wallet engines
      // syncing for the life of the process, and this line is the only
      // evidence that happened.
      const message = errorMessage(error)
      this.report.error(
        `account logout failed for ${redactSessionId(
          sessionId
        )} (${reason}); its wallet engines may still be running: ${message}`
      )
    }
    this.events.emit(
      'session.expired',
      {
        sessionId: redactSessionId(sessionId),
        reason
      },
      { kind: 'session', sessionId }
    )
    this.clearProcessCaches()
  }

  /**
   * Wait for the session's other requests to finish, up to LOGOUT_WAIT_MS.
   *
   * `SessionRecord.inFlight` exists for exactly this, and its own comment
   * names "a `spend` on a congested chain" — but only `isExpired` read it,
   * so the auto-logout ticker was protected and an explicit logout was not.
   * A `POST /logout` from a second shell could therefore land between
   * `broadcastTx` and `saveTx`: the money leaves the wallet, the client gets
   * no response it can trust, and local history does not have the
   * transaction until a sync finds it. That is the outcome `shutdown` drains
   * for; the logout path has the same blast radius.
   *
   * Bounded, because a wedged request must not make a logout impossible —
   * logout is a security control. What was abandoned is logged rather than
   * passed over in silence.
   */
  private async waitForQuiet(
    record: SessionRecord,
    sessionId: string,
    ownRequests: number
  ): Promise<void> {
    await drainToFloor({
      inFlight: () => record.inFlight,
      floor: ownRequests,
      budgetMs: LOGOUT_WAIT_MS,
      describe: stuck =>
        `logging ${redactSessionId(sessionId)} out with ` +
        `${stuck} request(s) still in flight after ${LOGOUT_WAIT_MS}ms`,
      warn: message => {
        this.report.warn(message)
      }
    })
  }

  /**
   * Release every object handle the session owned.
   *
   * A `swap_` handle holds a live `EdgeSwapQuote` whose `onExpire` closes the
   * order, and a staged `tx_` handle holds a signed transaction. Left in the
   * store they outlive the account they belong to for the rest of their
   * 5-minute TTL, with nothing able to release them earlier.
   */
  private async releaseHandles(sessionId: string): Promise<void> {
    const objects = this.objects
    if (objects == null) return
    await objects.deleteBySession(sessionId)
  }

  /**
   * Drop process-wide caches once no account is logged in.
   *
   * The rate cache was an app-session cache in the GUI; behind a daemon it
   * grows one entry per transaction date of every wallet of every account the
   * engine serves, and an engine started with `--idle-timeout=0` never exits.
   * Nothing is lost by dropping it: every entry is a historical rate that can
   * be fetched again.
   */
  private clearProcessCaches(): void {
    if (this.sessions.size > 0) return
    clearRateCache()
  }

  async logoutAll(): Promise<void> {
    const ids = [...this.sessions.keys()]
    for (const id of ids) {
      await this.forceLogout(id, 'shutdown')
    }
  }

  startAutoLogoutTicker(): void {
    if (this.ticker != null) return
    this.ticker = makeSweepTicker(
      'auto-logout ticker',
      async () => {
        await this.tick()
      },
      this.report
    )
    this.ticker.start()
  }

  stopAutoLogoutTicker(): void {
    if (this.ticker != null) {
      this.ticker.stop()
      this.ticker = null
    }
  }

  /**
   * Hold a session open for the duration of one request.
   *
   * Returns a release function rather than exposing the counter, so a caller
   * cannot forget which session it incremented. `lastActivityAt` is refreshed
   * on release too: a long call means the session was in use the whole time,
   * not only when it started.
   */
  beginRequest(sessionId: string): () => void {
    const record = this.sessions.get(sessionId)
    if (record == null) return () => {}
    // Evaluated *before* the hold is taken. `isExpired` returns false while
    // `inFlight > 0`, so taking the hold first stopped the session expiring
    // at the moment a request arrived: the handler's own `getSession` never
    // saw the expiry, and it then set `lastActivityAt` and re-armed the full
    // window. Any request landing in the up-to-15-second gap after the
    // window closed was served on a session that should have been gone, and
    // revived it — and auto-logout is a security control, not a
    // convenience. The counter's job is to protect a call that *outlives*
    // the window, which is a different thing from admitting a new one.
    if (this.isExpired(record)) {
      throw engineError('SESSION_EXPIRED', 'Session expired; log in again', 401)
    }
    record.inFlight++
    let released = false
    return () => {
      if (released) return
      released = true
      record.inFlight--
      record.lastActivityAt = Date.now()
    }
  }

  /**
   * Whether the window has passed, for the sweeper and for a new request.
   *
   * `inFlight > 0` means the *sweeper* must leave the session alone: a call
   * that outlives the window has to finish, and tearing the account down
   * under it is the failure this counter exists to prevent. It does not mean
   * the session is fresh, which is what `beginRequest` is asking — so
   * sharing one answer let a long call hold the window open for *new*
   * requests: a ten-minute `wait-for-all-wallets` admitted a `get-pin` on
   * the same session five minutes past a sixty-second window, and releasing
   * it restarted the window again. `forSweep` keeps the sweeper's reading
   * and `beginRequest` gets the question it actually asks.
   */
  private isExpired(
    record: SessionRecord,
    opts: { forSweep?: boolean } = {}
  ): boolean {
    if (record.autoLogoutSeconds === 0) return false
    if (opts.forSweep === true && record.inFlight > 0) return false
    const elapsed = (Date.now() - record.lastActivityAt) / 1000
    return elapsed > record.autoLogoutSeconds
  }

  private async tick(): Promise<void> {
    // Re-read the setting before judging the window. It is documented as
    // mirroring the GUI, where `AutoLogoutModal` takes effect immediately, so
    // a user who shortens it on their phone — or lengthens it because a long
    // CLI run keeps timing out — has to see that on a session the engine is
    // already holding.
    for (const record of [...this.sessions.values()]) {
      // Auto-logout off is re-read on a slower cadence, not skipped. The
      // cost argument is real — `isExpired` answers false for `0` before it
      // looks at a window, and the read is a decrypt plus a parse on core's
      // synced disklet with no cache — but skipping it outright made `0` a
      // one-way latch: a session created while the setting said `0` captured
      // it at `create` and the ticker never looked again, so a user turning
      // auto-logout back on from their phone had no effect on a session the
      // engine was already holding. It stayed logged in for the life of the
      // process while `engine-sessions` reported `autoLogoutSeconds: 0` as
      // though that were still their choice. Auto-logout is a security
      // control and `0` is the one value whose staleness has no upper bound.
      if (
        record.autoLogoutSeconds === 0 &&
        Date.now() - record.lastSettingReadAt < DISABLED_RECHECK_MS
      ) {
        continue
      }
      // Before the read, so a persistently unreadable file is retried on the
      // same slow cadence rather than on every tick.
      record.lastSettingReadAt = Date.now()
      try {
        record.autoLogoutSeconds = await reReadAutoLogoutSeconds(record.account)
      } catch {
        // Keep the last known value: an unreadable Settings.json is not a
        // reason to change the window. This arm is reachable only because
        // `reReadAutoLogoutSeconds` lets the failure out; the lenient reader
        // swallows it and answers with the default, which would silently
        // replace the user's choice.
      }
    }
    for (const [id, record] of this.sessions) {
      if (this.isExpired(record, { forSweep: true })) {
        await this.forceLogout(id, 'expired')
      }
    }
  }

  toInfo(record: SessionRecord): SessionInfo {
    const expiresAt =
      record.autoLogoutSeconds === 0
        ? null
        : new Date(
            record.lastActivityAt + record.autoLogoutSeconds * 1000
          ).toISOString()
    return {
      sessionId: record.sessionId,
      username: record.account.username,
      rootLoginId: record.account.rootLoginId,
      loginMethod: record.loginMethod,
      autoLogoutSeconds: record.autoLogoutSeconds,
      expiresAt,
      lastActivityAt: new Date(record.lastActivityAt).toISOString(),
      createdAt: new Date(record.createdAt).toISOString()
    }
  }
}
