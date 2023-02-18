import React from 'react'

import { useHandler } from './useHandler'

/**
 * A convenient utility hook to simply invoke a callback function when the
 * component mounts.
 */
export const useMount = (callback: () => void) => {
  // Change of the callback should not cause the effect to re-render
  const cb = useHandler(callback)
  React.useEffect(() => {
    cb()
  }, [cb])
}
