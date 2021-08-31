// @flow

import { showError } from '../components/services/AirshipInstance.js'
import { useState } from '../types/reactHooks.js'

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
