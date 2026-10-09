import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals'

import { asyncWaterfall } from '../../util/utils'

/** A server that answers or fails after `ms`. */
const after =
  (ms: number, outcome: { value?: string; error?: unknown }) =>
  async (): Promise<string> =>
    await new Promise<string>((resolve, reject) => {
      setTimeout(() => {
        if ('error' in outcome) reject(outcome.error)
        else resolve(outcome.value ?? '')
      }, ms)
    })

/**
 * The waterfall behind the rates, info-server and coinrank fetches.
 *
 * It tracked servers by their position in an array, and positions moved: a
 * primary that was slow and then failed — the common outage shape — was
 * spliced out by a stale index, the `pop()` after it took a still-running
 * fallback with it, and the call threw while healthy servers were in flight.
 */
describe('asyncWaterfall', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })
  afterEach(() => {
    jest.useRealTimers()
  })

  it('answers from the fallback when a slow primary then fails', async () => {
    const result = asyncWaterfall(
      [
        after(150, { error: new Error('server0') }),
        after(300, { value: 'ok' })
      ],
      100
    )
    const settled = result.then(
      value => ({ value }),
      (error: unknown) => ({ error })
    )
    await jest.advanceTimersByTimeAsync(400)
    expect(await settled).toStrictEqual({ value: 'ok' })
  })

  it('keeps every healthy server when only the first fails', async () => {
    const result = asyncWaterfall(
      [
        after(150, { error: new Error('server0') }),
        after(400, { value: 'one' }),
        after(250, { value: 'two' })
      ],
      100
    )
    const settled = result.then(
      value => ({ value }),
      (error: unknown) => ({ error })
    )
    await jest.advanceTimersByTimeAsync(600)
    // Server 2 started when server 0 failed, at 150 ms, and answers at
    // 400 ms; server 1 answers at 500 ms.
    expect(await settled).toStrictEqual({ value: 'two' })
  })

  it('rethrows the last failure, unwrapped, once every server has failed', async () => {
    const result = asyncWaterfall(
      [after(10, { error: 'first' }), after(10, { error: 'second' })],
      100
    )
    const settled = result.then(
      value => ({ value }),
      (error: unknown) => ({ error })
    )
    await jest.advanceTimersByTimeAsync(50)
    // A string, which the old code could not tag with an index at all.
    expect(await settled).toStrictEqual({ error: 'second' })
  })

  it('does not start the next server while the first is inside its stagger', async () => {
    let started = 0
    const counted = (value: string) => async (): Promise<string> => {
      ++started
      return await after(50, { value })()
    }
    const result = asyncWaterfall([counted('a'), counted('b')], 100)
    await jest.advanceTimersByTimeAsync(60)
    expect(await result).toBe('a')
    expect(started).toBe(1)
    // And no stagger timer is left armed behind the answer.
    expect(jest.getTimerCount()).toBe(0)
  })
})
