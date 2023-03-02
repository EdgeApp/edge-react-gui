import * as React from 'react'
import { Metrics, SafeAreaProvider } from 'react-native-safe-area-context'
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
  return (
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <Provider store={store}>{children}</Provider>
    </SafeAreaProvider>
  )
}

// These match what our old react-native-safe-area-view library returned:
const initialMetrics: Metrics = {
  frame: { height: 1334, width: 750, x: 0, y: 0 },
  insets: { bottom: 0, left: 0, right: 0, top: 20 }
}
