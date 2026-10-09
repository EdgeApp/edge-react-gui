import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import type { EdgeAccount } from 'edge-core-js'

import type { EventHub } from '../../cli/engine/events'
import { ObjectHandleStore } from '../../cli/engine/objectHandles'
import { SessionStore } from '../../cli/engine/sessions'
import { makeFakeDiskletAccount } from '../../util/fake/fakeDisklet'

/**
 * An account whose synced Settings.json is whatever the test supplies.
 *
 * Through the shared fake, with a `logout` spy layered on: this store's
 * whole job is to call it at the right moment.
 */
function makeAccount(settings?: string): {
  account: EdgeAccount
  logout: jest.Mock<() => Promise<void>>
} {
  const logout = jest.fn<() => Promise<void>>(async () => {})
  const account = {
    ...makeFakeDiskletAccount({ synced: settings }),
    logout
  } as unknown as EdgeAccount
  return { account, logout }
}

/** The `code` an engineError carries, which is the contract callers read. */
function codeOf(fn: () => unknown): string {
  try {
    fn()
  } catch (error) {
    return (error as { code: string }).code
  }
  throw new Error('expected a throw')
}

const events = {
  emit: () => {},
  closeScope: () => {}
} as unknown as EventHub

describe('SessionStore auto-logout', () => {
  let store: SessionStore

  beforeEach(() => {
    // `create` drains the core pixie stack with `setImmediate`, so that one
    // stays real; everything else is faked so the idle window can be advanced.
    jest.useFakeTimers({ doNotFake: ['setImmediate', 'nextTick'] })
    store = new SessionStore(events)
  })

  it('defaults to an hour when Settings.json is absent', async () => {
    const { account } = makeAccount()
    const info = await store.create(account, 'password')
    expect(info.autoLogoutSeconds).toBe(3600)
    expect(info.expiresAt).not.toBeNull()
  })

  it('reads the account setting', async () => {
    const { account } = makeAccount('{"autoLogoutTimeInSeconds":60}')
    const info = await store.create(account, 'password')
    expect(info.autoLogoutSeconds).toBe(60)
  })

  it('logs the account out once it has been idle for that long', async () => {
    const { account, logout } = makeAccount('{"autoLogoutTimeInSeconds":60}')
    const { sessionId } = await store.create(account, 'password')
    store.startAutoLogoutTicker()

    await jest.advanceTimersByTimeAsync(50_000)
    expect(store.get(sessionId).sessionId).toBe(sessionId)
    expect(logout).not.toHaveBeenCalled()

    await jest.advanceTimersByTimeAsync(30_000)
    expect(logout).toHaveBeenCalledTimes(1)
    expect(store.size).toBe(0)
    store.stopAutoLogoutTicker()
  })

  it('a touched session keeps its window', async () => {
    const { account, logout } = makeAccount('{"autoLogoutTimeInSeconds":60}')
    const { sessionId } = await store.create(account, 'password')
    store.startAutoLogoutTicker()

    await jest.advanceTimersByTimeAsync(50_000)
    store.touch(sessionId)
    await jest.advanceTimersByTimeAsync(50_000)

    expect(logout).not.toHaveBeenCalled()
    expect(store.size).toBe(1)
    store.stopAutoLogoutTicker()
  })

  it('0 disables the timeout entirely', async () => {
    const { account, logout } = makeAccount('{"autoLogoutTimeInSeconds":0}')
    const info = await store.create(account, 'password')
    store.startAutoLogoutTicker()

    // `expiresAt` is null exactly when the timeout is disabled.
    expect(info.expiresAt).toBeNull()
    await jest.advanceTimersByTimeAsync(4 * 60 * 60 * 1000)
    expect(logout).not.toHaveBeenCalled()
    expect(store.size).toBe(1)
    store.stopAutoLogoutTicker()
  })

  it('an expired session answers SESSION_EXPIRED, a logged-out one INVALID_SESSION', async () => {
    const { account } = makeAccount('{"autoLogoutTimeInSeconds":60}')
    const { sessionId } = await store.create(account, 'password')

    // Past its window but not yet swept: the only path that reports 401
    // SESSION_EXPIRED rather than a missing session.
    jest.advanceTimersByTime(61_000)
    expect(codeOf(() => store.get(sessionId))).toBe('SESSION_EXPIRED')

    const second = await store.create(makeAccount().account, 'password')
    await store.logout(second.sessionId)
    expect(codeOf(() => store.get(second.sessionId))).toBe('INVALID_SESSION')
  })

  it('does not log out a session with a request in flight', async () => {
    const { account, logout } = makeAccount('{"autoLogoutTimeInSeconds":60}')
    const { sessionId } = await store.create(account, 'password')
    store.startAutoLogoutTicker()

    // A call that outlives the window — a cold `wait-for-all-wallets`, a
    // `spend` on a congested chain — used to be logged out from underneath
    // itself, because `lastActivityAt` records only when a request started.
    const release = store.beginRequest(sessionId)
    await jest.advanceTimersByTimeAsync(5 * 60 * 1000)
    expect(logout).not.toHaveBeenCalled()
    expect(store.get(sessionId).sessionId).toBe(sessionId)

    // Releasing refreshes the activity clock, so the window starts again
    // rather than expiring the moment the request returns.
    release()
    await jest.advanceTimersByTimeAsync(30_000)
    expect(logout).not.toHaveBeenCalled()

    await jest.advanceTimersByTimeAsync(60_000)
    expect(logout).toHaveBeenCalledTimes(1)
    store.stopAutoLogoutTicker()
  })

  it('releases the object handles the session owned', async () => {
    const onExpire = jest.fn<() => void>()
    const objects = new ObjectHandleStore()
    store.objects = objects
    const { account } = makeAccount()
    const { sessionId } = await store.create(account, 'password')
    objects.create({
      kind: 'swap',
      prefix: 'swap_',
      value: { quote: true },
      sessionId,
      onExpire
    })
    // Another session's handle must survive.
    objects.create({
      kind: 'swap',
      prefix: 'swap_',
      value: { quote: true },
      sessionId: 'sess_other'
    })
    expect(objects.size).toBe(2)

    await store.logout(sessionId)

    // A `swap_` handle holds a live quote whose `onExpire` closes the order,
    // so leaving it behind held the exchange's order for the rest of the TTL.
    expect(onExpire).toHaveBeenCalledTimes(1)
    expect(objects.size).toBe(1)
  })

  it('picks up a changed auto-logout setting on the next tick', async () => {
    const logout = jest.fn<() => Promise<void>>(async () => {})
    let settings = '{"autoLogoutTimeInSeconds":3600}'
    const account = {
      username: 'clitester',
      rootLoginId: 'root123',
      logout,
      waitForAllWallets: async () => {},
      disklet: { getText: async () => settings }
    } as unknown as EdgeAccount

    const { sessionId } = await store.create(account, 'password')
    expect(store.get(sessionId).autoLogoutSeconds).toBe(3600)
    store.startAutoLogoutTicker()

    // The documentation says the engine mirrors the GUI, where
    // `AutoLogoutModal` takes effect immediately. Freezing the value at login
    // meant a user who shortened it on their phone saw no change at all.
    settings = '{"autoLogoutTimeInSeconds":60}'
    await jest.advanceTimersByTimeAsync(16_000)
    expect(logout).not.toHaveBeenCalled()

    await jest.advanceTimersByTimeAsync(61_000)
    expect(logout).toHaveBeenCalledTimes(1)
    store.stopAutoLogoutTicker()
  })

  it('keeps the last known window when the re-read fails', async () => {
    const logout = jest.fn<() => Promise<void>>(async () => {})
    let readable = true
    const account = {
      username: 'clitester',
      rootLoginId: 'root123',
      logout,
      waitForAllWallets: async () => {},
      disklet: {
        getText: async () => {
          // Not an absent file: a failure to read one that is there.
          if (!readable) throw new Error('could not decrypt')
          return '{"autoLogoutTimeInSeconds":0}'
        }
      }
    } as unknown as EdgeAccount

    const { sessionId } = await store.create(account, 'password')
    // 0 is documented as "auto-logout disabled".
    expect(store.get(sessionId).autoLogoutSeconds).toBe(0)
    store.startAutoLogoutTicker()

    readable = false
    // The ticker's `catch` used to be dead code, because the reader swallowed
    // the failure and answered with the cleaner's 3600 — so a transient read
    // error silently re-enabled auto-logout and logged this session out an
    // hour later.
    await jest.advanceTimersByTimeAsync(3_600_000 + 60_000)
    expect(store.peek(sessionId)?.autoLogoutSeconds).toBe(0)
    expect(logout).not.toHaveBeenCalled()
    store.stopAutoLogoutTicker()
  })

  it('refuses a request that arrives after the window closed', async () => {
    const { account } = makeAccount('{"autoLogoutTimeInSeconds":60}')
    const { sessionId } = await store.create(account, 'password')

    // The sweeper runs every 15 seconds, so a request can arrive up to that
    // long after the window closes. `inFlight` makes `isExpired` false, so
    // taking the hold before testing expiry served that request on a dead
    // session *and* re-armed the window for another full minute.
    await jest.advanceTimersByTimeAsync(61_000)
    expect(codeOf(() => store.beginRequest(sessionId))).toBe('SESSION_EXPIRED')
  })

  it('re-reads an off setting a quarter as often as the ticker runs', async () => {
    const logout = jest.fn<() => Promise<void>>(async () => {})
    let reads = 0
    const account = {
      username: 'clitester',
      rootLoginId: 'root123',
      logout,
      waitForAllWallets: async () => {},
      disklet: {
        getText: async () => {
          reads++
          return '{"autoLogoutTimeInSeconds":0}'
        }
      }
    } as unknown as EdgeAccount

    await store.create(account, 'password')
    const afterLogin = reads
    store.startAutoLogoutTicker()
    // The ticker runs every 15s; a session with auto-logout off re-reads at
    // most once a minute, because `isExpired` answers false for `0` before
    // it looks at a window and the read is a decrypt plus a parse with no
    // cache. Two minutes is two reads, not eight.
    await jest.advanceTimersByTimeAsync(120_000)
    expect(reads - afterLogin).toBeLessThanOrEqual(2)
    expect(reads).toBeGreaterThan(afterLogin)
    store.stopAutoLogoutTicker()
  })

  it('applies auto-logout turned back on from another device', async () => {
    const logout = jest.fn<() => Promise<void>>(async () => {})
    // Off at login, then re-enabled on the user's phone.
    let setting = '{"autoLogoutTimeInSeconds":0}'
    const account = {
      username: 'clitester',
      rootLoginId: 'root123',
      logout,
      waitForAllWallets: async () => {},
      disklet: { getText: async () => setting }
    } as unknown as EdgeAccount

    const { sessionId } = await store.create(account, 'password')
    expect(store.get(sessionId).autoLogoutSeconds).toBe(0)
    // `peek`, not `get`: `expiresAt` is derived in `toInfo`, which is what
    // `engine-sessions` publishes.
    expect(store.peek(sessionId)?.expiresAt).toBeNull()
    store.startAutoLogoutTicker()

    // Skipping the re-read entirely made `0` a one-way latch: the session
    // stayed logged in for the life of the process, and `engine-sessions`
    // kept reporting `autoLogoutSeconds: 0` as though it were still the
    // user's choice.
    setting = '{"autoLogoutTimeInSeconds":60}'
    // The re-read lands on the 60s tick, and `isExpired` wants the window
    // genuinely exceeded, so the logout falls on the tick after it.
    await jest.advanceTimersByTimeAsync(90_000)
    expect(logout).toHaveBeenCalledTimes(1)
    store.stopAutoLogoutTicker()
  })
})

describe('SessionStore teardown order', () => {
  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['setImmediate', 'nextTick'] })
  })

  it('releases what the account owns before logging it out', async () => {
    // The order this class documents, and the one it did not follow:
    // `account.logout()` invalidates every wallet the handlers hold, so
    // running it first left a live swap quote or a signed transaction with
    // nothing able to release it — exactly what the class comment warns
    // about — and made the bounded wait in `deleteMany` protect nothing.
    const order: string[] = []
    const { account, logout } = makeAccount()
    logout.mockImplementation(async () => {
      order.push('logout')
    })
    const store = new SessionStore({
      emit: () => {},
      closeScope: () => order.push('closeScope')
    } as unknown as EventHub)
    store.objects = {
      deleteBySession: async () => {
        order.push('releaseHandles')
      }
    } as unknown as ObjectHandleStore

    const { sessionId } = await store.create(account, 'password')
    await store.logout(sessionId)

    expect(order).toStrictEqual(['closeScope', 'releaseHandles', 'logout'])
  })

  it('drains the session requests before releasing its handles', async () => {
    // The ordering defect inside the fix above. `deleteMany` abandons a
    // `consuming` handle after HANDLE_BUSY_WAIT_MS (10 s) while this wait
    // allows the request holding it LOGOUT_WAIT_MS (30 s), so releasing
    // first gave up on the handle twenty seconds before the request that
    // owned it finished — and `hold`'s `finally` then pushed its TTL out
    // again, leaving a signed transaction or a swap quote in the store with
    // a fresh lease and its account about to vanish.
    const order: string[] = []
    const { account, logout } = makeAccount()
    logout.mockImplementation(async () => {
      order.push('logout')
    })
    const store = new SessionStore({
      emit: () => {},
      closeScope: () => order.push('closeScope')
    } as unknown as EventHub)
    store.objects = {
      deleteBySession: async () => {
        order.push('releaseHandles')
      }
    } as unknown as ObjectHandleStore

    const { sessionId } = await store.create(account, 'password')
    const ownHold = store.beginRequest(sessionId)
    const release = store.beginRequest(sessionId)
    const pending = store.logout(sessionId)

    await jest.advanceTimersByTimeAsync(5_000)
    // The scope closes at once — a subscriber must not keep reading an
    // account that is going away — but nothing the account owns is released
    // while a request still holds it.
    expect(order).toStrictEqual(['closeScope'])

    release()
    await jest.advanceTimersByTimeAsync(100)
    await pending
    expect(order).toStrictEqual(['closeScope', 'releaseHandles', 'logout'])
    ownHold()
  })

  it('reports a failed account logout rather than passing over it', async () => {
    const errored = jest.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const { account, logout } = makeAccount()
      logout.mockImplementation(async () => {
        throw new Error('core said no')
      })
      const store = new SessionStore(events)
      const { sessionId } = await store.create(account, 'password')
      // The record leaves the map first, so nothing can retry this: `logout`
      // answers `INVALID_SESSION` and no route reaches the account again. An
      // account that failed to log out keeps its wallet engines syncing for
      // the life of the process, and this line is the only evidence.
      await store.logout(sessionId)
      expect(errored).toHaveBeenCalled()
      const said = String(errored.mock.calls[0][0])
      expect(said).toContain('account logout failed')
      expect(said).toContain('core said no')
      // Redacted, like every other session id the engine prints.
      expect(said).not.toContain(sessionId)
    } finally {
      errored.mockRestore()
    }
  })

  it('waits for the session own requests before logging out', async () => {
    const { account, logout } = makeAccount()
    const store = new SessionStore(events)
    const { sessionId } = await store.create(account, 'password')

    // Two holds, as the real arrangement has: the request serving the logout
    // itself, and a second shell's `spend` that is still running. `inFlight`
    // exists for this — its comment names a `spend` on a congested chain —
    // and only `isExpired` read it, so a `POST /logout` could land between
    // `broadcastTx` and `saveTx`. The logout's own hold is discounted or the
    // wait would deadlock on itself.
    const ownHold = store.beginRequest(sessionId)
    const release = store.beginRequest(sessionId)
    const pending = store.logout(sessionId)
    await jest.advanceTimersByTimeAsync(5_000)
    expect(logout).not.toHaveBeenCalled()

    release()
    await jest.advanceTimersByTimeAsync(100)
    await pending
    expect(logout).toHaveBeenCalledTimes(1)
    ownHold()
  })

  it('logs out anyway once the wait is exhausted', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const { account, logout } = makeAccount()
      const store = new SessionStore(events)
      const { sessionId } = await store.create(account, 'password')
      // The logout's own hold, plus one that is never released: a wedged
      // request must not make logout impossible, because logout is a
      // security control.
      store.beginRequest(sessionId)
      store.beginRequest(sessionId)

      const pending = store.logout(sessionId)
      await jest.advanceTimersByTimeAsync(31_000)
      await pending

      expect(logout).toHaveBeenCalledTimes(1)
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('still in flight')
      )
    } finally {
      warn.mockRestore()
    }
  })
})

/**
 * A long call holds the window open for itself, not for new requests.
 *
 * `isExpired` answered false whenever anything was in flight, and
 * `beginRequest` shared that answer — so a ten-minute `wait-for-all-wallets`
 * admitted a fresh request on the same session five minutes past a
 * sixty-second window, and releasing it restarted the window again. The
 * counter exists to stop a call being logged out from underneath itself,
 * which is a different question from whether a *new* request may start.
 */
describe('the expiry window against an in-flight call', () => {
  let store: SessionStore

  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['setImmediate', 'nextTick'] })
    store = new SessionStore(events)
  })

  it('refuses a new request while a long call holds the session', async () => {
    const { account, logout } = makeAccount(
      JSON.stringify({ autoLogoutTimeInSeconds: 60 })
    )
    const { sessionId } = await store.create(account, 'password')
    store.startAutoLogoutTicker()

    const release = store.beginRequest(sessionId)
    await jest.advanceTimersByTimeAsync(5 * 60 * 1000)
    // The call itself is untouched: that is what the counter is for.
    expect(logout).not.toHaveBeenCalled()
    expect(store.get(sessionId).sessionId).toBe(sessionId)
    // A second request is not admitted, and does not revive the window.
    expect(codeOf(() => store.beginRequest(sessionId))).toBe('SESSION_EXPIRED')

    release()
    store.stopAutoLogoutTicker()
  })
})
