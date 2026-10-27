import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals'
import { act, renderHook } from '@testing-library/react-native'

import { useRefresher } from '../../hooks/useRefresher'

describe('useRefresher', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  const advance = async (ms: number): Promise<void> => {
    await act(async () => {
      await jest.advanceTimersByTimeAsync(ms)
    })
  }

  it('refreshes right away and then once per delay without a default value', async () => {
    const refresh = jest.fn(async () => 1)
    const rendered = renderHook(() => useRefresher(refresh, undefined, 1000))
    await advance(0)
    expect(refresh).toHaveBeenCalledTimes(1)

    await advance(1000)
    expect(refresh).toHaveBeenCalledTimes(2)
    await advance(1000)
    expect(refresh).toHaveBeenCalledTimes(3)
    rendered.unmount()
  })

  it('waits one delay before refreshing with a default value', async () => {
    const refresh = jest.fn(async () => 1)
    const rendered = renderHook(() => useRefresher(refresh, 0, 1000))
    await advance(999)
    expect(refresh).not.toHaveBeenCalled()

    await advance(1)
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(rendered.result.current).toBe(1)
    rendered.unmount()
  })

  it('stops refreshing once unmounted', async () => {
    const refresh = jest.fn(async () => 1)
    const rendered = renderHook(() => useRefresher(refresh, undefined, 1000))
    await advance(0)
    rendered.unmount()

    await advance(5000)
    expect(refresh).toHaveBeenCalledTimes(1)
  })
})
