/**
 * Ephemeral handles for core objects that expose methods.
 *
 * In the core JS API, identity is "the object reference." Over HTTP that
 * does not work, so the engine stores the live value under an `objectId` and
 * deletes it after OBJECT_HANDLE_TTL_MS (5 minutes) from create/update, or
 * sooner when the caller finishes (e.g. save-tx) or explicitly deletes the
 * handle. Reads do not refresh the TTL; only `update` does.
 *
 * Holds the four kinds in `ObjectHandleKind`: a staged `transaction` from
 * makeSpend, a `pendingLogin` from requestEdgeLogin, a `swap` quote, and a
 * `lobby` — anything core returns that you later call methods on, and so
 * cannot cross JSON.
 */
import crypto from 'crypto'

import { base58 } from '../../util/encoding'
import type { PeriodicTask } from '../../util/PeriodicTask'
import { withDeadline } from '../../util/withDeadline'
import { engineError, errorMessage } from './errors'
import { consoleReporter, type EngineReporter } from './logger'
import type { asObjectHandleInfo } from './schemas'
// A value import, which is safe in this direction: `sessions.ts` takes
// `ObjectHandleStore` as `import type`, so that edge is erased.
import { redactSessionId } from './sessions'
import { HANDLE_BUSY_WAIT_MS, HANDLE_TEARDOWN_WAIT_MS } from './shutdownTiming'
import { makeSweepTicker } from './sweepTicker'

/** Default TTL for method-bearing core object handles. */
export const OBJECT_HANDLE_TTL_MS = 5 * 60 * 1000

export type ObjectHandleKind = 'transaction' | 'pendingLogin' | 'swap' | 'lobby'

/**
 * What every handle answer carries.
 *
 * From the cleaner, not a third hand-written copy of the same six fields:
 * `schemas.ts` declares them once, `asInspectedHandle` and
 * `asTransactionHandle` build on the same shape, and this is what the store
 * returns — so the interface and the published declaration cannot describe
 * different objects.
 */
export type ObjectHandleInfo = ReturnType<typeof asObjectHandleInfo>

export interface HandleRecord<T = unknown> {
  objectId: string
  kind: ObjectHandleKind
  value: T
  sessionId?: string
  walletId?: string
  createdAt: number
  expiresAt: number
  /** The handle's own window, so a refresh cannot silently promote it. */
  ttlMs: number
  onExpire?: (value: T) => void | Promise<void>
  /**
   * Set while a consuming call is in flight. A handle whose operation moves
   * funds must not be usable twice, and the operation outlives the client's
   * socket timeout, so a retry would otherwise find the handle still present.
   */
  consuming?: boolean
  /**
   * Set when a bulk release gave up waiting for the call in flight.
   *
   * `deleteMany`'s wait is bounded — a wedged call must not stop the engine
   * exiting — so a logout or a shutdown can walk away from a handle whose
   * operation is still running. `hold` reads this on the way out: re-arming
   * such a record gave a signed transaction a fresh 5-minute window with its
   * session already gone, so no later `deleteBySession` could match it and
   * only the sweeper would ever reach it, against a dead account.
   */
  abandoned?: boolean
}

function makeObjectId(prefix: string): string {
  return prefix + base58.stringify(crypto.randomBytes(12))
}

/**
 * Where a release failure is written.
 *
 * `EngineLogger`'s shape, narrowed to what this store uses: everything the
 * engine reports with `console` goes to `engine-startup.log`, which a clean
 * stop deletes — so a `quote.close()` the exchange refused left no record at
 * all. The handle log line belongs in `engine-<profile>.log` with the rest of
 * the engine's history.
 */
type HandleLogger = EngineReporter

export class ObjectHandleStore {
  private readonly handles = new Map<string, HandleRecord>()
  private ticker: PeriodicTask | null = null
  private readonly logger: HandleLogger
  /**
   * How long a bulk release waits for a handle whose call is in flight.
   *
   * Injectable for the tests that drive the abandonment path: the real
   * window is ten seconds, which is the right trade for a shutdown and the
   * wrong one for a suite that runs in fifteen.
   */
  private readonly busyWaitMs: number

  constructor(
    logger: HandleLogger = consoleReporter,
    busyWaitMs: number = HANDLE_BUSY_WAIT_MS
  ) {
    this.logger = logger
    this.busyWaitMs = busyWaitMs
  }

  get size(): number {
    return this.handles.size
  }

  /**
   * Handles that nothing else is holding the engine open for.
   *
   * `transaction` and `swap` handles carry a `sessionId`, and a session
   * already holds the engine. Two kinds do not: `pendingLogin`, because
   * `/request-edge-login` is not account-scoped, and `lobby`, because
   * `/admin/make-lobby` is not either. Both have a TTL equal to the default
   * idle timeout and both are created to be polled for their whole life, so
   * without this the `--no-wait` flows those routes document left the engine
   * with nothing to hold it and the idle timer tore the context down under
   * the lobby the user was still showing a QR code for.
   */
  get sessionlessCount(): number {
    let n = 0
    for (const record of this.handles.values()) {
      if (record.sessionId == null) n++
    }
    return n
  }

  /** Notified whenever a handle is created or released. */
  onHandlesChanged: (() => void) | null = null

  private handlesChanged(): void {
    try {
      this.onHandlesChanged?.()
    } catch {
      // A listener must never break handle creation or release.
    }
  }

  startTicker(): void {
    if (this.ticker != null) return
    this.ticker = makeSweepTicker(
      'handle sweep',
      async () => {
        await this.sweep()
      },
      this.logger
    )
    this.ticker.start()
  }

  stopTicker(): void {
    if (this.ticker != null) {
      this.ticker.stop()
      this.ticker = null
    }
  }

  /**
   * Release every handle a session owned.
   *
   * Called on logout: a `swap_` handle holds a live `EdgeSwapQuote` whose
   * `onExpire` closes the order, and a staged `tx_` handle holds a signed
   * transaction, so left behind they outlive their account for the rest of
   * the TTL with nothing able to release them earlier.
   */
  async deleteBySession(sessionId: string): Promise<void> {
    const ids = [...this.handles.entries()]
      .filter(([, record]) => record.sessionId === sessionId)
      .map(([id]) => id)
    await this.deleteMany(ids, `session ${sessionId.slice(0, 10)}`)
  }

  async clearAll(): Promise<void> {
    await this.deleteMany([...this.handles.keys()], 'engine shutdown')
  }

  /**
   * Release a set of handles, waiting for any that are mid-call.
   *
   * The bulk paths used to call `delete` straight away, which does not test
   * `consuming` — so they bypassed the invariant the rest of the store
   * honours, and `objectHandles.test.ts` asserts. Two states reached it: a
   * `logout` from a second shell while `approve-swap-quote` was inside
   * `consume`, which ran `onExpire` → `quote.close()` on a quote mid-approve;
   * and a shutdown during a `broadcast-tx`, which released the handle under
   * the call so `txHandleResponse` answered 404 after the money had left.
   *
   * Bounded, because a wedged call must not stop the engine exiting, and the
   * abandonment is logged rather than silent.
   */
  private async deleteMany(ids: string[], why: string): Promise<void> {
    const deadline = Date.now() + this.busyWaitMs
    const abandoned: string[] = []
    for (const id of ids) {
      while (this.handles.get(id)?.consuming === true) {
        if (Date.now() > deadline) break
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      const busy = this.handles.get(id)
      if (busy?.consuming === true) {
        // Marked, so `hold` releases it when its operation finally returns
        // rather than re-arming a handle this caller has walked away from.
        busy.abandoned = true
        abandoned.push(id)
        continue
      }
      // One handle's teardown failure must not leave the rest of the set in
      // place: a logout releases every handle the session owned, and a
      // shutdown every handle there is. `delete` logs each one.
      await this.delete(id).catch(() => {})
    }
    if (abandoned.length > 0) {
      // `this.logger`, not `console`: this is the one class that already
      // holds a logger, and it used it eleven lines away while writing the
      // abandonment — the thing a reader of a wedged engine most wants — to
      // the file the stop deletes.
      this.logger.warn(
        `${why}: gave up waiting for ${abandoned.join(', ')} after ` +
          `${this.busyWaitMs}ms; left in place`
      )
    }
  }

  create<T>(opts: {
    kind: ObjectHandleKind
    prefix: string
    value: T
    sessionId?: string
    walletId?: string
    onExpire?: (value: T) => void | Promise<void>
    ttlMs?: number
  }): ObjectHandleInfo & { value: T } {
    const ttlMs = opts.ttlMs ?? OBJECT_HANDLE_TTL_MS
    const now = Date.now()
    const objectId = makeObjectId(opts.prefix)
    const record: HandleRecord<T> = {
      objectId,
      kind: opts.kind,
      value: opts.value,
      sessionId: opts.sessionId,
      walletId: opts.walletId,
      createdAt: now,
      expiresAt: now + ttlMs,
      ttlMs,
      onExpire: opts.onExpire
    }
    this.handles.set(objectId, record as HandleRecord)
    this.handlesChanged()
    return {
      objectId,
      kind: opts.kind,
      createdAt: new Date(record.createdAt).toISOString(),
      expiresAt: new Date(record.expiresAt).toISOString(),
      sessionId: opts.sessionId,
      walletId: opts.walletId,
      value: opts.value
    }
  }

  /**
   * The session a handle records as its owner, with none of the liveness
   * checks `get` applies.
   *
   * `requireOwnedHandle` has to answer `OBJECT_SESSION_MISMATCH` ahead of all
   * of them. `get` reports `OBJECT_IN_USE`, `OBJECT_EXPIRED` and
   * `OBJECT_KIND_MISMATCH` first, so with two accounts logged into one engine
   * A could probe B's object ids for their kind and liveness — and the expiry
   * branch does not only report, it calls `delete`, which runs `onExpire`:
   * for a swap that is `quote.close()` at the exchange. `undefined` means no
   * such handle, which is not the same as a handle whose owner is null.
   */
  peekOwner(objectId: string): { sessionId: string | undefined } | undefined {
    const record = this.handles.get(objectId)
    if (record == null) return undefined
    return { sessionId: record.sessionId }
  }

  get<T>(objectId: string, kind?: ObjectHandleKind): HandleRecord<T> {
    const record = this.handles.get(objectId)
    if (record == null) {
      throw engineError(
        'OBJECT_NOT_FOUND',
        `No object handle: ${objectId}`,
        404
      )
    }
    // Before expiry: a handle whose operation is still running has not
    // expired, it is busy. Reporting it as expired would also release it, and
    // releasing runs `onExpire` — for a swap that is `quote.close()` on a
    // quote that is mid-approval.
    if (record.consuming === true) {
      throw engineError(
        'OBJECT_IN_USE',
        `Object handle is already being consumed: ${objectId}`,
        409
      )
    }
    if (Date.now() > record.expiresAt) {
      // Not awaited — the caller is being told the handle expired, not asked
      // to wait for the exchange — and not discarded either: `delete` runs
      // `onExpire`, which for a swap closes the quote at the exchange, and
      // it has already written the failure to the engine log by the time
      // this rejects. Caught so a release failure is not an unhandled
      // rejection, which in a daemon is a crash.
      this.delete(objectId).catch(() => {})
      throw engineError(
        'OBJECT_EXPIRED',
        `Object handle expired: ${objectId}`,
        410
      )
    }
    if (kind != null && record.kind !== kind) {
      throw engineError(
        'OBJECT_KIND_MISMATCH',
        `Expected kind ${kind}, got ${record.kind}`,
        400
      )
    }
    return record as HandleRecord<T>
  }

  /**
   * Run a consuming operation under an in-flight guard, releasing the handle
   * whether it succeeds or fails.
   *
   * `get` rejects the handle with `OBJECT_IN_USE` for as long as `operation`
   * runs, so a client that retries after its own socket timeout cannot start
   * the same fund-moving call twice.
   *
   * A failure releases too, because from outside the plugin there is no way
   * to tell a failure before the money moved from one after. A swap
   * `approve()` signs, broadcasts, and then does post-broadcast bookkeeping;
   * an error from that last step used to unlock the handle, so a retry of
   * `approve-swap-quote` re-signed and re-broadcast — on an account-based
   * chain, a second real transfer of the user's funds. Releasing means a
   * retry answers `OBJECT_NOT_FOUND` and the caller has to fetch a fresh
   * quote, which is the only safe reading of an ambiguous failure.
   *
   * A call that genuinely does not consume its handle uses `hold` instead.
   */
  async consume<T, R>(
    record: HandleRecord<T>,
    operation: (value: T) => Promise<R>
  ): Promise<R> {
    record.consuming = true
    // Push the expiry out before the await, not after. A core call can take
    // minutes, and an expiry that lands mid-call would otherwise release the
    // handle and run `onExpire` underneath the operation. The sweeper skips a
    // consuming record as well, because an operation can outlive even a
    // refreshed window.
    record.expiresAt = Date.now() + record.ttlMs
    try {
      return await operation(record.value)
    } finally {
      // The teardown's failure must not become the operation's: an
      // `approve-swap-quote` that signed and broadcast has succeeded even if
      // closing the quote afterwards did not, and reporting the close
      // failure in its place would tell the caller the money did not move.
      // `delete` has logged it against the handle.
      await this.delete(record.objectId).catch(() => {})
    }
  }

  /**
   * Hold a handle open across a call that does not consume it.
   *
   * `broadcast-tx` and `sign-tx` keep their handle afterwards, but their core
   * call can outlive the TTL: the expiry was checked on the way *out*, through
   * `update`, so a broadcast that crossed the boundary threw `OBJECT_EXPIRED`
   * after the money had already left — no txid in the response, no handle left
   * to `save-tx` with, and the transaction missing from local history until a
   * sync found it.
   */
  async hold<T, R>(
    record: HandleRecord<T>,
    operation: (value: T) => Promise<R>
  ): Promise<R> {
    record.consuming = true
    record.expiresAt = Date.now() + record.ttlMs
    try {
      return await operation(record.value)
    } finally {
      // Only when this record is still the one the store holds, and only
      // when nothing gave up on it: `deleteMany`'s wait is bounded, so a
      // logout or a shutdown can abandon a handle mid-call, and clearing
      // `consuming` on such a record gave it a fresh window that no
      // `deleteBySession` could ever match.
      if (this.handles.get(record.objectId) === record) {
        if (record.abandoned === true) {
          await this.release(record.objectId)
        } else {
          record.consuming = false
          record.expiresAt = Date.now() + record.ttlMs
        }
      }
    }
  }

  /**
   * Replace the stored value and refresh the TTL (another full window).
   */
  update<T>(
    objectId: string,
    value: T,
    opts?: { ttlMs?: number }
  ): ObjectHandleInfo {
    // Deliberately not `get`: the caller already holds this record, and a
    // handle being written to is not a handle to reject as busy or expired.
    const record = this.handles.get(objectId) as HandleRecord<T> | undefined
    if (record == null) {
      throw engineError(
        'OBJECT_NOT_FOUND',
        `No object handle: ${objectId}`,
        404
      )
    }
    const ttlMs = opts?.ttlMs ?? record.ttlMs
    record.value = value
    record.ttlMs = ttlMs
    record.expiresAt = Date.now() + ttlMs
    return this.toInfo(record)
  }

  toInfo<T = unknown>(record: HandleRecord<T>): ObjectHandleInfo {
    return {
      objectId: record.objectId,
      kind: record.kind,
      createdAt: new Date(record.createdAt).toISOString(),
      expiresAt: new Date(record.expiresAt).toISOString(),
      sessionId: record.sessionId,
      walletId: record.walletId
    }
  }

  /**
   * Release a handle because a caller asked to, reporting a teardown failure
   * rather than answering with it.
   *
   * `delete` rethrows what `onExpire` threw, which is right for the
   * housekeeping paths — each decides whether to carry on — and wrong as an
   * answer to "release this handle": the handle is gone either way, so a 500
   * would report a failure for an operation that succeeded. The part the
   * caller cannot see is in the engine log, with the handle's id and kind,
   * written by `delete` before it rethrew. `cancel-request` found this the
   * hard way: core's `cancelRequest()` throws when the lobby it refers to
   * has already gone, which is the ordinary case for a login that completed
   * before the caller cancelled it.
   */
  async release(objectId: string): Promise<boolean> {
    try {
      return await this.delete(objectId)
    } catch {
      // Already reported, with more detail than a caller could use.
      return true
    }
  }

  /**
   * Release a handle, running its teardown.
   *
   * The handle leaves the map either way: it is gone, and nothing can call
   * it again. A teardown that *failed* is a different matter, and this used
   * to swallow it and still answer `true` — so `delete` could not reject for
   * that reason at all, and the four sites written to catch it were
   * unreachable code: `get`'s expiry path, `consume`'s `finally`, the
   * sweeper's `onError` — which exists because "a hand-rolled
   * `.catch(() => {})` discarded it" — and `sessions.releaseHandles`.
   *
   * What was lost is a liability: `quote.close()` is the engine's only
   * cancellation of a real order at a swap partner, and it runs on a logout,
   * a shutdown and every 5-minute expiry, so an exchange refusing it left
   * the order live with no log line and no event. Reported here, where the
   * `objectId` and `kind` are known, and rethrown so the caller can decide —
   * the explicit release routes answer their caller, and the housekeeping
   * paths carry on.
   */
  async delete(objectId: string): Promise<boolean> {
    const record = this.handles.get(objectId)
    if (record == null) return false
    this.handles.delete(objectId)
    this.handlesChanged()
    if (record.onExpire != null) {
      try {
        // Bounded, because `onExpire` is caller-supplied and reaches
        // third-party code: a `swap` handle's is `quote.close()`, a plugin
        // HTTP call to an exchange. `deleteMany` bounded only its wait for
        // a call already in flight, so `clearAll()` — the shutdown's
        // second phase — inherited whatever this took, and every other
        // teardown phase has a ceiling for exactly that reason. A timeout
        // is reported through the same arm as a refusal.
        await withDeadline(
          Promise.resolve(record.onExpire(record.value)),
          HANDLE_TEARDOWN_WAIT_MS,
          `releasing the ${record.kind} handle did not finish`
        )
      } catch (error: unknown) {
        const message = errorMessage(error)
        // Redacted: a `sessionId` is a bearer token — holding one is full
        // account authority — and this line goes into a log file an
        // operator pastes into a bug report, kept for seven days by the
        // sweep. `events.ts` and `server.ts` redact the same value; this
        // was the one site that did not, reachable whenever a swap
        // partner refuses a `quote.close()` at the handle's TTL.
        const redactedOwner =
          record.sessionId == null
            ? undefined
            : redactSessionId(record.sessionId)
        this.logger.warn(`Releasing ${record.kind} handle failed: ${message}`, {
          objectId,
          kind: record.kind,
          sessionId: redactedOwner,
          walletId: record.walletId
        })
        throw new Error(
          `Releasing ${record.kind} handle ${objectId} failed: ${message}`
        )
      }
    }
    return true
  }

  private async sweep(): Promise<void> {
    const now = Date.now()
    for (const [id, record] of this.handles) {
      // A busy handle is never swept: `delete` runs `onExpire`, which for a
      // swap closes the quote at the exchange.
      if (record.consuming === true) continue
      if (now > record.expiresAt) {
        // Already logged by `delete`, and the sweep must reach the rest of
        // the map: the ticker's `onError` would end this pass.
        await this.delete(id).catch(() => {})
      }
    }
  }
}
