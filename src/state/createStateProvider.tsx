import React, { useContext } from 'react'

/**
 * This creates a "state provider" component from a getter function.
 * The function passed is a getter function to return the value for the state
 * provider's context.
 *
 * @param getValue the function to return the context value
 * @returns The context provider component and a useContextValue hook
 */
export function createStateProvider<Value>(getValue: () => Value): [React.FunctionComponent<{ children: React.ReactNode }>, () => Value] {
  const Context = React.createContext<Value | undefined>(undefined)
  function WithContext({ children }: { children: React.ReactNode }) {
    const value = getValue()
    return <Context.Provider value={value}>{children}</Context.Provider>
  }

  function useContextValue() {
    const context = useContext(Context)
    if (context == null) throw new Error(`Cannot call useDefinedContext outside of ${Context.displayName}`)
    return context
  }

  return [WithContext, useContextValue]
}
