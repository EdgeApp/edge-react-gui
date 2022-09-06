// @flow

import { useState } from '../types/reactHooks'
import { useAsyncEffect } from './useAsyncEffect'

/**
 * Returns the value of an async function or an error.
 * Re-runs when its dependencies change, just like `useAsyncEffect`.
 */
export function useAsyncValue<T>(effect: () => Promise<T>, deps?: mixed[]): [T | null, Error | null] {
  const [value, setValue] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)

  let cancel = false
  useAsyncEffect(async () => {
    try {
      const value = await effect()
      if (cancel) return
      setValue(value)
      setError(null)
    } catch (error) {
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
