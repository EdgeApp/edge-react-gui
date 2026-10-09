import { beforeEach, describe, expect, it, jest } from '@jest/globals'

import {
  OBJECT_HANDLE_TTL_MS,
  ObjectHandleStore
} from '../../cli/engine/objectHandles'
import { redactSessionId } from '../../cli/engine/sessions'
import { thrownSync } from '../../util/fake/thrownEngineError'

/** The error shape `engineError` produces. */
/**
 * An `EngineReporter` whose `warn` a case can assert on.
 *
 * Both levels, because the store takes the engine's shared reporter now —
 * the same interface `EventHub`, `SessionStore`, `IdleShutdown`, the sweep
 * ticker and the listeners take, so one object reaches all of them.
 */
const reporter = (
  warn: (message: string, extra?: Record<string, unknown>) => void
): { warn: typeof warn; error: typeof warn } => ({ warn, error: () => {} })

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
    expect(thrownSync(() => store.get(objectId))).toEqual({
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
    expect(thrownSync(() => store.get(objectId, 'swap'))).toEqual({
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
      expect(thrownSync(() => store.get(objectId, 'swap'))).toEqual({
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

    it('releases the handle when the operation fails', async () => {
      const onExpire = jest.fn<() => void>()
      const { objectId } = store.create({
        kind: 'swap',
        prefix: 'swap_',
        value: { quote: true },
        onExpire,
        ttlMs: 1000
      })
      const record = store.get(objectId, 'swap')

      await expect(
        store.consume(record, async () => {
          jest.advanceTimersByTime(5000)
          throw new Error('INSUFFICIENT_FUNDS')
        })
      ).rejects.toThrow('INSUFFICIENT_FUNDS')

      // A swap `approve()` signs, broadcasts, and then does post-broadcast
      // bookkeeping. From out here a failure after the money moved is
      // indistinguishable from one before it, so the handle is gone and a
      // retry has to fetch a fresh quote rather than re-broadcasting.
      expect(onExpire).toHaveBeenCalledTimes(1)
      expect(thrownSync(() => store.get(objectId, 'swap')).code).toBe(
        'OBJECT_NOT_FOUND'
      )
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

/**
 * A teardown that fails against a third party has to be reportable.
 *
 * `quote.close()` is the engine's only cancellation of a real order at a
 * swap partner, and it runs on a logout, a shutdown and every 5-minute
 * expiry. The failure used to be swallowed twice — in the `onExpire`
 * callback and again in `delete`, which still answered `true` — so an
 * exchange that refused the close left the order live with no log line, no
 * event, and four call sites catching something that could not happen.
 */
describe('a release whose teardown fails', () => {
  const refuses = async (): Promise<never> => {
    throw new Error('the exchange refused')
  }

  it('reports the handle’s id and kind, and rejects', async () => {
    const warn = jest.fn()
    const store = new ObjectHandleStore(reporter(warn))
    const handle = store.create({
      kind: 'swap',
      prefix: 'swap_',
      value: {},
      sessionId: 'session-1',
      onExpire: refuses
    })

    await expect(store.delete(handle.objectId)).rejects.toThrow(
      /Releasing swap handle swap_.* failed: the exchange refused/
    )
    expect(warn).toHaveBeenCalledTimes(1)
    expect(String(warn.mock.calls[0][0])).toContain('the exchange refused')
    expect(warn.mock.calls[0][1]).toMatchObject({
      objectId: handle.objectId,
      kind: 'swap',
      // Redacted, and this line used to assert the opposite — so the
      // suite was pinning the leak. A `sessionId` is a bearer token, and
      // this warning goes into the log file an operator pastes into a bug
      // report; the owner is only here to correlate.
      sessionId: redactSessionId('session-1')
    })
  })

  it('still releases the handle', async () => {
    const store = new ObjectHandleStore(reporter(() => {}))
    const handle = store.create({
      kind: 'swap',
      prefix: 'swap_',
      value: {},
      onExpire: refuses
    })
    await expect(store.delete(handle.objectId)).rejects.toThrow()
    // Gone from the map either way: nothing can call it again, and a handle
    // left behind would be released a second time by the sweeper.
    expect(store.size).toBe(0)
  })

  it('does not let a never-settling teardown stop the shutdown', async () => {
    // `clearAll()` is the shutdown's second phase, budgeted at
    // `HANDLE_BUSY_WAIT_MS`. `deleteMany` bounded only its wait for a call
    // already in flight; `onExpire` itself had no ceiling, and it is
    // caller-supplied — a `swap` handle's is `quote.close()`, a plugin's
    // HTTP call to an exchange. So one unresponsive partner meant the
    // engine never closed its listeners, never removed its run file and
    // never exited, holding the profile against every later invocation.
    const warn = jest.fn()
    const store = new ObjectHandleStore(reporter(warn))
    store.create({
      kind: 'swap',
      prefix: 'swap_',
      value: {},
      sessionId: 'session-1',
      onExpire: async () => {
        await new Promise<void>(() => {})
      }
    })

    jest.useRealTimers()
    try {
      await store.clearAll()
    } finally {
      jest.useFakeTimers()
    }
    // Reported through the same arm a refusal uses, and the store is empty.
    expect(warn).toHaveBeenCalledTimes(1)
    expect(String(warn.mock.calls[0][0])).toContain('did not finish')
    expect(store.size).toBe(0)
  }, 20_000)

  it('does not stop a bulk release reaching the rest', async () => {
    const warn = jest.fn()
    const store = new ObjectHandleStore(reporter(warn))
    store.create({
      kind: 'swap',
      prefix: 'swap_',
      value: {},
      sessionId: 'session-1',
      onExpire: refuses
    })
    store.create({
      kind: 'swap',
      prefix: 'swap_',
      value: {},
      sessionId: 'session-1',
      onExpire: refuses
    })
    await store.deleteBySession('session-1')
    expect(store.size).toBe(0)
    // Both reported, not just the first.
    expect(warn).toHaveBeenCalledTimes(2)
  })

  it('does not report a consuming call as failed', async () => {
    const warn = jest.fn()
    const store = new ObjectHandleStore(reporter(warn))
    const handle = store.create({
      kind: 'swap',
      prefix: 'swap_',
      value: 'quote',
      onExpire: refuses
    })
    const record = store.get<string>(handle.objectId)
    // The operation succeeded; only the close afterwards failed, and
    // reporting that in its place would tell the caller the money did not
    // move.
    await expect(
      store.consume(record, async value => `approved ${value}`)
    ).resolves.toBe('approved quote')
    expect(warn).toHaveBeenCalledTimes(1)
  })
})

/**
 * A caller who asked for a release gets one, not the teardown's failure.
 *
 * `delete` rethrows so the housekeeping paths can each decide; as an answer
 * to "release this handle" that would be a 500 for an operation that
 * succeeded. `cancel-request` found it: core's `cancelRequest()` throws when
 * the lobby has already gone, which is the ordinary case for a login that
 * completed before the caller cancelled it.
 */
describe('release', () => {
  it('answers true and reports, where delete rejects', async () => {
    const warn = jest.fn()
    const store = new ObjectHandleStore(reporter(warn))
    const handle = store.create({
      kind: 'pendingLogin',
      prefix: 'pending_',
      value: {},
      onExpire: async () => {
        throw new Error('Cannot call method on a destroyed lobby')
      }
    })
    await expect(store.release(handle.objectId)).resolves.toBe(true)
    expect(store.size).toBe(0)
    // Reported once, with the id and kind, by `delete`.
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][1]).toMatchObject({ kind: 'pendingLogin' })
  })

  it('answers false for a handle that is not there', async () => {
    const store = new ObjectHandleStore(reporter(() => {}))
    await expect(store.release('pending_nope')).resolves.toBe(false)
  })
})

/**
 * A handle a bulk release gave up on must not come back.
 *
 * `deleteMany`'s wait is bounded, because a wedged call must not stop the
 * engine exiting — so a logout or a shutdown can walk away from a handle
 * whose operation is still running. `hold`'s `finally` then cleared
 * `consuming` and re-armed a full TTL on a record whose session was already
 * gone: no later `deleteBySession` could match it, and the only thing that
 * would ever reach it was the sweeper, running `onExpire` against a dead
 * account.
 */
describe('hold against a bulk release', () => {
  it('releases a handle the release abandoned, rather than re-arming it', async () => {
    jest.useRealTimers()
    const closed: string[] = []
    // A 50 ms busy wait rather than the real ten seconds.
    const store = new ObjectHandleStore(
      reporter(() => {}),
      50
    )
    const handle = store.create({
      kind: 'swap',
      prefix: 'swap_',
      value: 'quote',
      sessionId: 'session-1',
      onExpire: async () => {
        closed.push(handle.objectId)
      }
    })
    const record = store.get<string>(handle.objectId)

    // An operation that outlasts the release's patience.
    let finish = (): void => {}
    const operation = store.hold(record, async () => {
      await new Promise<void>(resolve => {
        finish = resolve
      })
      return 'done'
    })
    // The logout: it waits, gives up, and leaves the handle in place.
    await store.deleteBySession('session-1')
    expect(store.size).toBe(1)

    finish()
    await expect(operation).resolves.toBe('done')
    // Gone, and its teardown ran — rather than sitting in the store with a
    // fresh window and no session to release it.
    expect(store.size).toBe(0)
    expect(closed).toStrictEqual([handle.objectId])
    jest.useFakeTimers()
  })

  it('tears the whole set down at once, not handle after handle', async () => {
    // `delete` gives every `onExpire` its own `HANDLE_TEARDOWN_WAIT_MS`, so
    // running them in sequence made `clearAll()` cost N × that ceiling while
    // `shutdownTiming` counted it once. Six swap quotes against an exchange
    // that is black-holing requests put the shutdown past the 230s the
    // client waits on, and a daemon draining exactly as designed was then
    // reported to the operator as wedged.
    jest.useRealTimers()
    const store = new ObjectHandleStore(reporter(() => {}))
    const slowClose = async (): Promise<void> => {
      await new Promise<void>(resolve => setTimeout(resolve, 200))
    }
    for (let i = 0; i < 4; ++i) {
      store.create({
        kind: 'swap',
        prefix: 'swap_',
        value: `quote-${i}`,
        sessionId: 'session-1',
        onExpire: slowClose
      })
    }

    const started = Date.now()
    await store.clearAll()
    const elapsed = Date.now() - started

    expect(store.size).toBe(0)
    // Four 200 ms closes: ~200 ms together, ~800 ms in sequence.
    expect(elapsed).toBeLessThan(600)
    jest.useFakeTimers()
  })

  it('re-arms a handle nothing gave up on', async () => {
    const store = new ObjectHandleStore(reporter(() => {}))
    const handle = store.create({
      kind: 'transaction',
      prefix: 'tx_',
      value: 'unsigned'
    })
    const record = store.get<string>(handle.objectId)
    await expect(store.hold(record, async () => 'signed')).resolves.toBe(
      'signed'
    )
    expect(store.size).toBe(1)
    expect(record.consuming).toBe(false)
  })
})
