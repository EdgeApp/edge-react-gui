import { useCallback, useEffect, useState } from '../types/reactHooks'

export const useAsync = (asyncFunction, immediate = true) => {
  const [pending, setPending] = useState(false)
  const [value, setValue] = useState(null)
  const [error, setError] = useState(null)

  // useCallback ensures useEffect is not called on every render, but only if asyncFunction changes.
  const execute = useCallback(() => {
    setError(null)
    setPending(true)
    setValue(null)

    return asyncFunction()
      .then(response => setValue(response))
      .catch(err => setError(err))
      .finally(() => setPending(false))
  }, [asyncFunction])

  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, [execute, immediate])

  return {
    error,
    execute,
    pending,
    value
  }
}
