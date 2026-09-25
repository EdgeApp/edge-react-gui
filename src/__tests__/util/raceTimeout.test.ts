import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals'

import { raceTimeout, TIMED_OUT } from '../../util/raceTimeout'

describe('raceTimeout', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })
  afterEach(() => {
    jest.useRealTimers()
  })

  it('resolves to the value when the promise settles first', async () => {
    const result = raceTimeout(Promise.resolve('value'), 1000)
    await expect(result).resolves.toBe('value')
    expect(jest.getTimerCount()).toBe(0)
  })

  it('resolves to TIMED_OUT when the timer fires first', async () => {
    let settle: (value: string) => void = () => {}
    const slow = new Promise<string>(resolve => {
      settle = resolve
    })
    const result = raceTimeout(slow, 1000)
    jest.advanceTimersByTime(1000)
    await expect(result).resolves.toBe(TIMED_OUT)
    expect(jest.getTimerCount()).toBe(0)
    // Losing the race does not cancel the promise:
    settle('late')
    await expect(slow).resolves.toBe('late')
  })

  it('rejects when the promise rejects first, and still clears the timer', async () => {
    const result = raceTimeout(Promise.reject(new Error('boom')), 1000)
    await expect(result).rejects.toThrow('boom')
    expect(jest.getTimerCount()).toBe(0)
  })

  it('does not time out before the deadline', async () => {
    let settle: (value: number) => void = () => {}
    const pending = new Promise<number>(resolve => {
      settle = resolve
    })
    const result = raceTimeout(pending, 1000)
    jest.advanceTimersByTime(999)
    settle(42)
    await expect(result).resolves.toBe(42)
  })
})
