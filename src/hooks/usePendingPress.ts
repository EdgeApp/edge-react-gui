import * as React from 'react'

import { showError } from '../components/services/AirshipInstance'
import { triggerHaptic } from '../util/haptic'

export type OnPress = () => void | Promise<void>

/**
 * Creates a `handlePress` function that calls a user-provided `onPress`
 * method and deals with any resulting promises by togging a pending flag
 * and showing errors.
 */
export function usePendingPress(onPress?: OnPress): [boolean, () => void] {
  const [pending, setPending] = React.useState(false)

  function handlePress(): void {
    if (onPress == null || pending) return
    triggerHaptic('impactLight')

    const out = onPress()
    if (out != null && typeof out.then === 'function') {
      setPending(true)
      out.then(
        () => {
          setPending(false)
        },
        (error: unknown) => {
          setPending(false)
          showError(error)
        }
      )
    }
  }

  return [pending, handlePress]
}
