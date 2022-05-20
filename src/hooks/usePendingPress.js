// @flow

import { type SharedValue, useSharedValue, withTiming } from 'react-native-reanimated'

import { showError } from '../components/services/AirshipInstance.js'
import { useRef, useState } from '../types/reactHooks.js'

export type OnPress = () => void | Promise<void>

/**
 * Creates a `handlePress` function that calls a user-provided `onPress`
 * method and deals with any resulting promises by togging a pending flag
 * and showing errors.
 */
export function usePendingPress(onPress?: OnPress): [boolean, () => void] {
  const [pending, setPending] = useState(false)

  function handlePress() {
    if (onPress == null || pending) return

    const out = onPress()
    if (out != null && typeof out.then === 'function') {
      setPending(true)
      out.then(
        () => setPending(false),
        error => {
          setPending(false)
          showError(error)
        }
      )
    }
  }

  return [pending, handlePress]
}

/**
 * The same as `usePendingPress`, but returns an animated value.
 * This looks nicer, and avoids a re-render.
 */
export function usePendingPressAnimation(onPress?: OnPress): [SharedValue<number>, () => void] {
  const pending = useRef(false)
  const animation = useSharedValue(0)

  function handlePress() {
    if (onPress == null || pending.current) return

    const out = onPress()
    if (out != null && typeof out.then === 'function') {
      pending.current = true
      animation.value = withTiming(1)
      out.then(
        () => {
          pending.current = false
          animation.value = withTiming(0)
        },
        error => {
          pending.current = false
          animation.value = withTiming(0)
          showError(error)
        }
      )
    }
  }

  return [animation, handlePress]
}
