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

export type ObjectHandleKind =
  | 'transaction'
  | 'pendingLogin'
  | 'pendingWalletShare'
  | 'swap'
  | 'lobby'

export interface ObjectHandleInfo {
  objectId: string
  kind: ObjectHandleKind
  expiresAt: string
  sessionId?: string
  walletId?: string
}

interface HandleRecord<T = unknown> {
  objectId: string
  kind: ObjectHandleKind
  value: T
  sessionId?: string
  walletId?: string
  createdAt: number
  expiresAt: number
  onExpire?: (value: T) => void | Promise<void>
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
   * Replace the stored value and refresh the TTL (another full window).
   */
  update<T>(
    objectId: string,
    value: T,
    opts?: { ttlMs?: number }
  ): ObjectHandleInfo {
    const record = this.get<T>(objectId)
    const ttlMs = opts?.ttlMs ?? OBJECT_HANDLE_TTL_MS
    record.value = value
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
      if (now > record.expiresAt) {
        await this.delete(id)
      }
    }
  }
}
