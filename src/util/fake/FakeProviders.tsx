import * as React from 'react'
import { Provider } from 'react-redux'
import { applyMiddleware, createStore } from 'redux'
import thunk from 'redux-thunk'

import { rootReducer, RootState } from '../../reducers/RootReducer'

type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>
    }
  : T

export type FakeState = DeepPartial<RootState>

interface Props {
  children: React.ReactNode
  initialState?: FakeState
}

export function FakeProviders(props: Props) {
  const { children, initialState = {} } = props

  const store = React.useMemo(() => createStore(rootReducer, initialState as any, applyMiddleware(thunk)), [initialState])
  return <Provider store={store}>{children}</Provider>
}
