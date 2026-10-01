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
 * session's subscriptions, release the object handles it owned, wait for the
 * session's other requests, log the account out, emit, then clear the process
 * caches. A handle outliving its account is a live swap quote or a signed
 * transaction with nothing able to release it — and `account.logout()` is
 * what invalidates them, so it comes after the release and not before. It was
 * missing from this list while the code ran it first, which is how that
 * inversion survived.
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
import { engineError } from './errors'
import type { EventHub } from './events'
import type { ObjectHandleStore } from './objectHandles'
import type { asLoginMethod } from './schemas'
import { makeSweepTicker } from './sweepTicker'

/**
 * How long a logout waits for the session's other requests to finish.
 *
 * Long enough to cover a broadcast on a congested chain, which is the call
 * whose interruption actually costs something, and short enough that an
 * operator does not conclude the command has hung. Shorter than
 * `SHUTDOWN_DRAIN_MS`, because a shutdown has nothing else to do and a
 * logout is one request among many.
 */
const LOGOUT_WAIT_MS = 30_000

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
export type LoginMethod = ReturnType<typeof asLoginMethod>

/**
 * A session as `engine-sessions` publishes it: the id is truncated.
 *
 * A distinct type, so a caller of `list()` cannot be handed to something
 * expecting a usable `sessionId` without the compiler objecting.
 */
export interface SessionListing extends Omit<SessionInfo, 'sessionId'> {
  sessionId: string
}

export interface SessionInfo {
  sessionId: string
  username: string | undefined
  rootLoginId: string
  loginMethod: LoginMethod
  autoLogoutSeconds: number
  expiresAt: string | null
  lastActivityAt: string
  createdAt: string
}

export interface SessionRecord {
  sessionId: string
  account: EdgeAccount
  loginMethod: LoginMethod
  autoLogoutSeconds: number
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
export function redactSessionId(sessionId: string): string {
  return sessionId.slice(0, 10) + '\u2026'
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

  constructor(events: EventHub) {
    this.events = events
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
    if (this.isExpired(record)) {
      // Logged, not discarded: `forceLogout` closes this session's
      // subscriptions and releases its object handles, and for a swap that
      // means closing the order at the exchange. A failure there is worth a
      // line — which is the reason `makeSweepTicker` has an `onError` at
      // all.
      this.forceLogout(sessionId, 'expired').catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error)
        console.warn(
          `[edge-engine] auto-logout of ${redactSessionId(
            sessionId
          )} failed: ${message}`
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
    if (this.isExpired(record)) return null
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
    await this.releaseHandles(sessionId)
    // And not while this session is still serving something else.
    await this.waitForQuiet(record, sessionId, opts.ownRequests ?? 0)
    try {
      await record.account.logout()
    } catch {
      // best effort
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
    const deadline = Date.now() + LOGOUT_WAIT_MS
    while (record.inFlight > ownRequests && Date.now() < deadline) {
      await new Promise(resolve => setTimeout(resolve, 25))
    }
    const stuck = record.inFlight - ownRequests
    if (stuck > 0) {
      console.warn(
        `[edge-engine] logging ${redactSessionId(sessionId)} out with ` +
          `${stuck} request(s) still in flight after ${LOGOUT_WAIT_MS}ms`
      )
    }
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
    this.ticker = makeSweepTicker('auto-logout ticker', async () => {
      await this.tick()
    })
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

  private isExpired(record: SessionRecord): boolean {
    if (record.autoLogoutSeconds === 0) return false
    if (record.inFlight > 0) return false
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
      // Skipped when auto-logout is off: `isExpired` returns false before it
      // looks at the window, so re-reading a synced file 240 times an hour
      // per session buys nothing. The read is a decrypt plus a parse on
      // core's *synced* disklet and there is deliberately no cache.
      if (record.autoLogoutSeconds === 0) continue
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
      if (this.isExpired(record)) {
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
