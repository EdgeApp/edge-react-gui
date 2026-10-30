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

  // The guard reads this ref instead of the state above, since state stays
  // stale until the next render and a second tap can land before that:
  const pendingRef = React.useRef(false)

  function handlePress(): void {
    if (onPress == null || pendingRef.current) return
    triggerHaptic('impactLight')

    const out = onPress()
    if (out != null && typeof out.then === 'function') {
      pendingRef.current = true
      setPending(true)
      out.then(
        () => {
          pendingRef.current = false
          setPending(false)
        },
        (error: unknown) => {
          pendingRef.current = false
          setPending(false)
          showError(error)
        }
      )
    }
  }

  return [pending, handlePress]
}
