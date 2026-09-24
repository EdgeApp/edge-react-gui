/**
 * Ephemeral handles for core objects that expose methods.
 *
 * In the core JS API, identity is "the object reference." Over HTTP that
 * does not work, so the engine stores the live value under an `objectId` and
 * deletes it after OBJECT_HANDLE_TTL_MS (5 minutes) from create/update, or
 * sooner when the caller finishes (e.g. save-tx) or explicitly deletes the
 * handle. Reads do not refresh the TTL; only `update` does.
 *
 * Use this for makeSpend transactions, pending Edge logins, and future swap
 * quote / exchange objects — anything returned from core that you later call
 * methods on.
 */
import crypto from 'crypto'

import { base58 } from './encoding'
import { engineError } from './errors'

/** Default TTL for method-bearing core object handles. */
export const OBJECT_HANDLE_TTL_MS = 5 * 60 * 1000

export type ObjectHandleKind = 'transaction' | 'pendingLogin' | 'swap' | 'lobby'

export interface ObjectHandleInfo {
  objectId: string
  kind: ObjectHandleKind
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
  private ticker: ReturnType<typeof setInterval> | null = null
  private sweepInFlight: Promise<void> | null = null

  get size(): number {
    return this.handles.size
  }

  startTicker(): void {
    if (this.ticker != null) return
    this.ticker = setInterval(() => {
      if (this.sweepInFlight != null) return
      this.sweepInFlight = this.sweep()
        .catch(() => {})
        .finally(() => {
          this.sweepInFlight = null
        })
    }, 15_000)
    this.ticker.unref?.()
  }

  stopTicker(): void {
    if (this.ticker != null) {
      clearInterval(this.ticker)
      this.ticker = null
    }
  }

  async clearAll(): Promise<void> {
    const ids = [...this.handles.keys()]
    for (const id of ids) {
      await this.delete(id)
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
    return {
      objectId,
      kind: opts.kind,
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
   * when it succeeds and unlocking it when it fails.
   *
   * `get` rejects the handle with `OBJECT_IN_USE` for as long as `operation`
   * runs, so a client that retries after its own socket timeout cannot start
   * the same fund-moving call twice. A failure unlocks rather than releases,
   * because a quote or staged transaction is still usable after an error the
   * caller can correct.
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
    let result: R
    try {
      result = await operation(record.value)
    } catch (error) {
      record.consuming = false
      record.expiresAt = Date.now() + record.ttlMs
      throw error
    }
    await this.delete(record.objectId)
    return result
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
      expiresAt: new Date(record.expiresAt).toISOString(),
      sessionId: record.sessionId,
      walletId: record.walletId
    }
  }

  async delete(objectId: string): Promise<boolean> {
    const record = this.handles.get(objectId)
    if (record == null) return false
    this.handles.delete(objectId)
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
