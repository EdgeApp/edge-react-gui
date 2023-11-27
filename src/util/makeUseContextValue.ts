import { useContext } from 'react'

export const makeUseContextValue = <T>(Context: React.Context<T | undefined>): (() => T) => {
  function useContextValue() {
    const context = useContext(Context)
    if (context == null) throw new Error(`Cannot call useDefinedContext outside of ${Context.displayName}`)
    return context
  }
  return useContextValue
}
