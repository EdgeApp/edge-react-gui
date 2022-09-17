import * as React from 'react'

import { useAsyncEffect } from './useAsyncEffect'

/**
 * Returns the value of an async function or an error.
 * Re-runs when its dependencies change, just like `useAsyncEffect`.
 */
export function useAsyncValue<T>(effect: () => Promise<T>, deps?: unknown[]): [T | null, Error | null] {
  const [value, setValue] = React.useState<T | null>(null)
  const [error, setError] = React.useState<Error | null>(null)

  let cancel = false
  useAsyncEffect(async () => {
    try {
      const value = await effect()
      if (cancel) return
      setValue(value)
      setError(null)
    } catch (error: any) {
      if (cancel) return
      setValue(null)
      setError(error)
    }
    return () => {
      cancel = true
    }
  }, deps)

  return [value, error]
}
