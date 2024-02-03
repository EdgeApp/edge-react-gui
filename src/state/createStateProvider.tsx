import React from 'react'
import { createContext, useContextSelector } from 'use-context-selector'

type Selector<State> = <T>(selector: (state: State) => T) => T
/**
 * This creates a "state provider" component from a getter function.
 * The function passed is a getter function to return the value for the state
 * provider's context.
 *
 * @param getState the function to return the context value (state)
 * @returns The context provider component and a useStateSelector hook to select context state
 */
export function createStateProvider<State>(getState: () => State): [React.FunctionComponent<{ children: React.ReactNode }>, Selector<State>] {
  const Context = createContext<State | undefined>(undefined)
  function WithContext({ children }: { children: React.ReactNode }) {
    const value = getState()
    return <Context.Provider value={value}>{children}</Context.Provider>
  }

  function useStateSelector<T>(selector: (state: State) => T): T {
    const state = useContextSelector(Context, state => {
      if (state == null) throw new Error(`Cannot call useStateSelector outside of ${Context.displayName}`)
      return selector(state)
    })
    return state
  }

  return [WithContext, useStateSelector]
}
