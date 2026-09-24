import { beforeEach, describe, expect, it, jest } from '@jest/globals'

import {
  OBJECT_HANDLE_TTL_MS,
  ObjectHandleStore
} from '../../cli/engine/objectHandles'

/** The error shape `engineError` produces. */
interface ThrownEngineError extends Error {
  code: string
  status: number
}

function codeOf(fn: () => unknown): { code: string; status: number } {
  try {
    fn()
  } catch (error) {
    const engineError = error as ThrownEngineError
    return { code: engineError.code, status: engineError.status }
  }
  throw new Error('expected a throw')
}

describe('ObjectHandleStore', () => {
  let store: ObjectHandleStore

  beforeEach(() => {
    jest.useFakeTimers()
    store = new ObjectHandleStore()
  })

  it('reads do not refresh the TTL, updates do', () => {
    const { objectId } = store.create({
      kind: 'transaction',
      prefix: 'tx_',
      value: { txid: 'a' }
    })

    jest.advanceTimersByTime(OBJECT_HANDLE_TTL_MS - 1000)
    store.get(objectId)
    jest.advanceTimersByTime(2000)
    expect(codeOf(() => store.get(objectId))).toEqual({
      code: 'OBJECT_EXPIRED',
      status: 410
    })
    expect(store.size).toBe(0)
  })

  it('refuses a handle of the wrong kind', () => {
    const { objectId } = store.create({
      kind: 'transaction',
      prefix: 'tx_',
      value: { txid: 'a' }
    })
    expect(codeOf(() => store.get(objectId, 'swap'))).toEqual({
      code: 'OBJECT_KIND_MISMATCH',
      status: 400
    })
  })

  it('runs onExpire exactly once when released', async () => {
    const onExpire = jest.fn<() => void>()
    const { objectId } = store.create({
      kind: 'swap',
      prefix: 'swap_',
      value: { quote: true },
      onExpire
    })

    expect(await store.delete(objectId)).toBe(true)
    expect(await store.delete(objectId)).toBe(false)
    expect(onExpire).toHaveBeenCalledTimes(1)
  })

  describe('consume', () => {
    it('refuses a second call while the first is in flight', async () => {
      const { objectId } = store.create({
        kind: 'swap',
        prefix: 'swap_',
        value: { quote: true }
      })
      const record = store.get(objectId, 'swap')

      let release = (): void => {}
      const inFlight = store.consume(record, async () => {
        await new Promise<void>(resolve => {
          release = resolve
        })
        return 'approved'
      })

      // The retry a client makes after its own socket timeout.
      expect(codeOf(() => store.get(objectId, 'swap'))).toEqual({
        code: 'OBJECT_IN_USE',
        status: 409
      })

      release()
      expect(await inFlight).toBe('approved')
      expect(store.size).toBe(0)
    })

    it('is not swept while in flight, even past its TTL', async () => {
      const onExpire = jest.fn<() => void>()
      const { objectId } = store.create({
        kind: 'swap',
        prefix: 'swap_',
        value: { quote: true },
        onExpire,
        ttlMs: 1000
      })
      const record = store.get(objectId, 'swap')
      store.startTicker()

      let release = (): void => {}
      const inFlight = store.consume(record, async () => {
        await new Promise<void>(resolve => {
          release = resolve
        })
        return 'approved'
      })

      // Long enough for the original TTL to lapse and the sweeper to run.
      await jest.advanceTimersByTimeAsync(60_000)

      // `delete` runs `onExpire`, which for a swap closes the quote at the
      // exchange — never while its approval is still running.
      expect(onExpire).not.toHaveBeenCalled()

      release()
      await inFlight
      expect(onExpire).toHaveBeenCalledTimes(1)
      store.stopTicker()
    })

    it('unlocks and refreshes the TTL when the operation fails', async () => {
      const { objectId } = store.create({
        kind: 'swap',
        prefix: 'swap_',
        value: { quote: true },
        ttlMs: 1000
      })
      const record = store.get(objectId, 'swap')

      await expect(
        store.consume(record, async () => {
          jest.advanceTimersByTime(5000)
          throw new Error('INSUFFICIENT_FUNDS')
        })
      ).rejects.toThrow('INSUFFICIENT_FUNDS')

      // Still usable: the caller may be able to correct the failure.
      expect(store.get(objectId, 'swap').objectId).toBe(objectId)
    })
  })

  describe('hold', () => {
    it('keeps a handle alive across a call that outlives its TTL', async () => {
      const onExpire = jest.fn<() => void>()
      const { objectId } = store.create({
        kind: 'transaction',
        prefix: 'tx_',
        value: { txid: 'unsigned' },
        onExpire,
        ttlMs: 1000
      })
      const record = store.get(objectId, 'transaction')
      store.startTicker()

      const broadcast = store.hold(record, async () => {
        await jest.advanceTimersByTimeAsync(60_000)
        return { txid: 'broadcast' }
      })

      expect(await broadcast).toEqual({ txid: 'broadcast' })
      expect(onExpire).not.toHaveBeenCalled()

      // The handle survives, so `save-tx` can still run against it.
      expect(store.update(objectId, { txid: 'broadcast' }).objectId).toBe(
        objectId
      )
      store.stopTicker()
    })
  })
})
