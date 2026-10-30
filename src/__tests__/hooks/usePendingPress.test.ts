import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { act, renderHook } from '@testing-library/react-native'

import { showError } from '../../components/services/AirshipInstance'
import { usePendingPress } from '../../hooks/usePendingPress'

jest.mock('../../components/services/AirshipInstance', () => ({
  showError: jest.fn()
}))

describe('usePendingPress', () => {
  beforeEach(() => {
    jest.mocked(showError).mockClear()
  })

  it('fires once for two presses before React re-renders', async () => {
    let finish: () => void = () => {}
    const pending = new Promise<void>(resolve => {
      finish = resolve
    })
    const onPress = jest.fn(async () => {
      await pending
    })
    const { result } = renderHook(() => usePendingPress(onPress))

    const [, handlePress] = result.current
    act(() => {
      handlePress()
      handlePress()
    })
    expect(onPress).toHaveBeenCalledTimes(1)
    expect(result.current[0]).toBe(true)

    await act(async () => {
      finish()
      await pending
    })
    expect(result.current[0]).toBe(false)

    act(() => {
      result.current[1]()
    })
    expect(onPress).toHaveBeenCalledTimes(2)

    await act(async () => {
      await pending
    })
  })

  it('reports a rejection and releases the lock', async () => {
    const error = new Error('boom')
    const onPress = jest.fn(async () => {
      throw error
    })
    const { result } = renderHook(() => usePendingPress(onPress))

    await act(async () => {
      result.current[1]()
      await Promise.resolve()
    })
    expect(showError).toHaveBeenCalledWith(error)
    expect(result.current[0]).toBe(false)

    await act(async () => {
      result.current[1]()
      await Promise.resolve()
    })
    expect(onPress).toHaveBeenCalledTimes(2)
  })

  it('leaves synchronous handlers repeatable', () => {
    const onPress = jest.fn<() => void>()
    const { result } = renderHook(() => usePendingPress(onPress))

    act(() => {
      result.current[1]()
      result.current[1]()
    })
    expect(onPress).toHaveBeenCalledTimes(2)
  })
})
