import { describe, expect, it, jest } from '@jest/globals'

import { withDeadline } from '../../util/withDeadline'

/**
 * The ceiling the rate queue did not have.
 *
 * `fetchRates(..., 5000, ...)` reads like a 5-second deadline, but that
 * number is `asyncWaterfall`'s per-server stagger and the timer is armed only
 * `if (pending > 1)` — so with one server left there is no timer at all and
 * `asyncWaterfall([never, never], 300)` stays pending. One rates server that
 * accepts and never answers then wedged every rate caller in the process,
 * because `inQuery` stayed latched and `getHistoricalRate` never rejects.
 */
describe('withDeadline', () => {
  it('rejects a promise that never settles', async () => {
    // `jestSetup.js` fakes every timer for the whole repo, so the deadline
    // has to be advanced rather than waited for — the same trap the logger
    // tests hit.
    jest.useFakeTimers()
    try {
      const never = new Promise<string>(() => {})
      const raced = withDeadline(never, 20, 'nothing answered')
      const assertion = expect(raced).rejects.toThrow(
        /nothing answered within 20ms/
      )
      await jest.advanceTimersByTimeAsync(20)
      await assertion
    } finally {
      jest.useRealTimers()
    }
  })

  it('passes a value through untouched when it is in time', async () => {
    expect(await withDeadline(Promise.resolve('ok'), 1000, 'x')).toBe('ok')
  })

  it('passes the original rejection through, not the deadline', async () => {
    // A server that refuses the connection has to stay distinguishable from
    // one that hangs, because only the second is a reason to raise the
    // ceiling.
    await expect(
      withDeadline(Promise.reject(new Error('ECONNREFUSED')), 1000, 'x')
    ).rejects.toThrow('ECONNREFUSED')
  })

  it('clears the timer when the promise wins', async () => {
    jest.useFakeTimers()
    try {
      const promise = withDeadline(Promise.resolve(1), 60_000, 'x')
      expect(await promise).toBe(1)
      // Otherwise a pass that answered in a millisecond would hold a timer
      // for the rest of the window — the leak `asyncWaterfall`'s own stagger
      // timers had, which `--detectOpenHandles` reported.
      expect(jest.getTimerCount()).toBe(0)
    } finally {
      jest.useRealTimers()
    }
  })

  it('clears the timer when the promise rejects', async () => {
    jest.useFakeTimers()
    try {
      await expect(
        withDeadline(Promise.reject(new Error('no')), 60_000, 'x')
      ).rejects.toThrow('no')
      expect(jest.getTimerCount()).toBe(0)
    } finally {
      jest.useRealTimers()
    }
  })
})
