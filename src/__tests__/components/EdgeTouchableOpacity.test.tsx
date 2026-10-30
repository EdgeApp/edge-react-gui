import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NavigationContext } from '@react-navigation/native'
import { act, fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Text } from 'react-native'

import { EdgeTouchableOpacity } from '../../components/common/EdgeTouchableOpacity'
import { showError } from '../../components/services/AirshipInstance'

jest.mock('../../components/services/AirshipInstance', () => ({
  showError: jest.fn()
}))

const makeDeferred = (): {
  promise: Promise<void>
  resolve: () => void
  reject: (error: unknown) => void
} => {
  let resolve: () => void = () => {}
  let reject: (error: unknown) => void = () => {}
  const promise = new Promise<void>((_resolve, _reject) => {
    resolve = _resolve
    reject = _reject
  })
  return { promise, resolve, reject }
}

/**
 * Delivers both presses before React can re-render, the way two taps land on a
 * busy JS thread. Pressing in separate `act` calls would flush state between
 * them and hide a stale guard.
 */
const pressTwiceInOneTick = (
  target: Parameters<typeof fireEvent.press>[0]
): void => {
  act(() => {
    fireEvent.press(target)
    fireEvent.press(target)
  })
}

const renderTouchable = (
  onPress: () => void | Promise<void>,
  extra: { debounce?: boolean; isFocused?: () => boolean } = {}
): ReturnType<typeof render> => {
  const { debounce, isFocused } = extra
  const touchable = (
    <EdgeTouchableOpacity debounce={debounce} onPress={onPress}>
      <Text>press me</Text>
    </EdgeTouchableOpacity>
  )
  if (isFocused == null) return render(touchable)
  return render(
    <NavigationContext.Provider value={{ isFocused } as any}>
      {touchable}
    </NavigationContext.Provider>
  )
}

describe('EdgeTouchableOpacity', () => {
  beforeEach(() => {
    jest.mocked(showError).mockClear()
  })

  it('fires an async handler once for two presses in one tick', async () => {
    const deferred = makeDeferred()
    const onPress = jest.fn(async () => {
      await deferred.promise
    })
    const rendered = renderTouchable(onPress)

    pressTwiceInOneTick(rendered.getByText('press me'))
    expect(onPress).toHaveBeenCalledTimes(1)

    await act(async () => {
      deferred.resolve()
      await deferred.promise
    })
  })

  it('holds the lock until the handler resolves, then releases it', async () => {
    const deferred = makeDeferred()
    const onPress = jest.fn(async () => {
      await deferred.promise
    })
    const rendered = renderTouchable(onPress)

    fireEvent.press(rendered.getByText('press me'))
    fireEvent.press(rendered.getByText('press me'))
    expect(onPress).toHaveBeenCalledTimes(1)

    await act(async () => {
      deferred.resolve()
      await deferred.promise
    })

    fireEvent.press(rendered.getByText('press me'))
    expect(onPress).toHaveBeenCalledTimes(2)
  })

  it('reports a rejection and releases the lock', async () => {
    const deferred = makeDeferred()
    const onPress = jest.fn(async () => {
      await deferred.promise
    })
    const rendered = renderTouchable(onPress)

    fireEvent.press(rendered.getByText('press me'))

    const error = new Error('boom')
    await act(async () => {
      deferred.reject(error)
      await deferred.promise.catch(() => {})
    })
    expect(showError).toHaveBeenCalledWith(error)

    fireEvent.press(rendered.getByText('press me'))
    expect(onPress).toHaveBeenCalledTimes(2)
  })

  it('releases the lock when a handler throws synchronously', () => {
    const onPress = jest.fn(() => {
      throw new Error('boom')
    })
    const rendered = renderTouchable(onPress, { debounce: true })

    fireEvent.press(rendered.getByText('press me'))
    fireEvent.press(rendered.getByText('press me'))

    expect(showError).toHaveBeenCalledTimes(2)
    expect(onPress).toHaveBeenCalledTimes(2)
  })

  it('fires a debounced handler once for two presses in one tick', () => {
    const onPress = jest.fn<() => void>()
    const rendered = renderTouchable(onPress, { debounce: true })

    pressTwiceInOneTick(rendered.getByText('press me'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('leaves plain synchronous handlers repeatable', () => {
    const onPress = jest.fn<() => void>()
    const rendered = renderTouchable(onPress, { isFocused: () => true })

    fireEvent.press(rendered.getByText('press me'))
    fireEvent.press(rendered.getByText('press me'))
    expect(onPress).toHaveBeenCalledTimes(2)
  })

  it('ignores presses once the scene has lost focus', () => {
    let focused = true
    const onPress = jest.fn(() => {
      // navigation.push moves focus before the new scene renders:
      focused = false
    })
    const rendered = renderTouchable(onPress, { isFocused: () => focused })

    pressTwiceInOneTick(rendered.getByText('press me'))
    expect(onPress).toHaveBeenCalledTimes(1)

    // Coming back to the scene restores the touchable:
    focused = true
    fireEvent.press(rendered.getByText('press me'))
    expect(onPress).toHaveBeenCalledTimes(2)
  })

  it('works outside a navigator, as in an Airship modal', () => {
    const onPress = jest.fn<() => void>()
    const rendered = renderTouchable(onPress)

    fireEvent.press(rendered.getByText('press me'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })
})
