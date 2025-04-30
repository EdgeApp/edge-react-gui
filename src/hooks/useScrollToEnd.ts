/**
 * IMPORTANT: Changes in this file MUST be synced between edge-react-gui and
 * edge-login-ui-rn!
 */
import * as React from 'react'
import { ScrollView } from 'react-native'

/**
 * This hook will return a ref, which you can attach to a scroll view.
 * When the `ready` parameter becomes true,
 * we will scroll that view to the bottom.
 */
export function useScrollToEnd(ready: boolean) {
  const ref = React.useRef<ScrollView | null>(null)
  React.useEffect(() => {
    if (ready && ref.current != null) ref.current.scrollToEnd()
  }, [ready])
  return ref
}
