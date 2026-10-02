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
import { engineError } from './errors'
import { HANDLE_BUSY_WAIT_MS } from './shutdownTiming'
import { makeSweepTicker } from './sweepTicker'

/** Default TTL for method-bearing core object handles. */
export const OBJECT_HANDLE_TTL_MS = 5 * 60 * 1000

export type ObjectHandleKind = 'transaction' | 'pendingLogin' | 'swap' | 'lobby'

export interface ObjectHandleInfo {
  objectId: string
  kind: ObjectHandleKind
  /** When the handle was created. */
  createdAt: string
  expiresAt: string
  sessionId?: string
  walletId?: string
}

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
}

function makeObjectId(prefix: string): string {
  return prefix + base58.stringify(crypto.randomBytes(12))
}

export class ObjectHandleStore {
  private readonly handles = new Map<string, HandleRecord>()
  private ticker: PeriodicTask | null = null

  get size(): number {
    return this.handles.size
  }

  /**
   * Handles that nothing else is holding the engine open for.
   *
   * Every handle kind but one implies a session, and a session already holds
   * the engine. `requestEdgeLogin` needs no session — `/request-edge-login`
   * is not account-scoped — and its handle's TTL is exactly the default idle
   * timeout, so the `--no-wait` flow the route documents left the engine with
   * nothing to hold it and the idle timer tore the context down under the
   * lobby the user was still showing a QR code for.
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
    this.ticker = makeSweepTicker('handle sweep', async () => {
      await this.sweep()
    })
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
    const deadline = Date.now() + HANDLE_BUSY_WAIT_MS
    const abandoned: string[] = []
    for (const id of ids) {
      while (this.handles.get(id)?.consuming === true) {
        if (Date.now() > deadline) break
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      if (this.handles.get(id)?.consuming === true) {
        abandoned.push(id)
        continue
      }
      await this.delete(id)
    }
    if (abandoned.length > 0) {
      console.warn(
        `[edge-engine] ${why}: gave up waiting for ${abandoned.join(
          ', '
        )} after ${HANDLE_BUSY_WAIT_MS}ms; left in place`
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
      // Logged, not discarded: `delete` runs `onExpire`, which for a swap
      // closes the quote at the exchange.
      this.delete(objectId).catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error)
        console.warn(
          `[edge-engine] releasing handle ${objectId} failed: ${message}`
        )
      })
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
      await this.delete(record.objectId)
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
      record.consuming = false
      record.expiresAt = Date.now() + record.ttlMs
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

  async delete(objectId: string): Promise<boolean> {
    const record = this.handles.get(objectId)
    if (record == null) return false
    this.handles.delete(objectId)
    this.handlesChanged()
    if (record.onExpire != null) {
      try {
        await record.onExpire(record.value)
      } catch {
        // best effort
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
        await this.delete(id)
      }
    }
  }
}
