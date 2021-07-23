// @flow

import { ScrollView } from 'react-native'

import { useEffect, useRef } from '../../types/reactHooks'

/**
 * This hook will return a ref, which you can attach to a scroll view.
 * When the `ready` parameter becomes true,
 * we will scroll that view to the bottom.
 */
export function useScrollToEnd(ready: boolean, delay: number = 0) {
  const ref = useRef<ScrollView | null>(null)
  useEffect(() => {
    setTimeout(() => {
      if (ready && ref.current !== null) ref.current.scrollToEnd()
    }, delay)
  }, [ready, delay])
  return ref
}
