import { useCallback, useEffect, useState } from '../types/reactHooks'

export const useAsync = (asyncFunction, immediate = true) => {
  // Use an object to avoid multiple renders when setting multiple values
  const [state, setState] = useState({ pending: false, value: null, error: null })

  // useCallback ensures useEffect is not called on every render, but only if asyncFunction changes.
  const resolveState = useCallback(async () => {
    setState({ pending: true, value: null, error: null })
    const newState = { error: null, pending: false, value: null }
    try {
      newState.value = await asyncFunction()
    } catch (e) {
      newState.error = e
    }
    setState(newState)
  }, [asyncFunction])

  useEffect(() => {
    if (immediate && state.value == null) resolveState()
  }, [resolveState, immediate, state.value])

  return [state, resolveState]
}
