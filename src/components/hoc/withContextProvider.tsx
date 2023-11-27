import React from 'react'

export function withContextProvider<T>(getValue: () => T): [React.FunctionComponent<{ children: React.ReactNode }>, React.Context<T | undefined>] {
  const Context = React.createContext<T | undefined>(undefined)
  function WithContext({ children }: { children: React.ReactNode }) {
    const value = getValue()
    return <Context.Provider value={value}>{children}</Context.Provider>
  }

  return [WithContext, Context]
}
