import * as React from 'react'

import { useAsyncEffect } from './useAsyncEffect'

/**
 * Returns the value of an async function or an error.
 * Re-runs when its dependencies change, just like `useAsyncEffect`.
 */
export function useAsyncValue<T>(effect: () => Promise<T>, deps?: unknown[]): [T | undefined, Error | undefined] {
  const [value, setValue] = React.useState<T | undefined>(undefined)
  const [error, setError] = React.useState<Error | undefined>(undefined)

  let cancel = false
  useAsyncEffect(async () => {
    try {
      const value = await effect()
      if (cancel) return
      setValue(value)
      setError(undefined)
    } catch (error: any) {
      if (cancel) return
      setValue(undefined)
      setError(error)
    }
    return () => {
      cancel = true
    }
  }, deps)

  return [value, error]
}
