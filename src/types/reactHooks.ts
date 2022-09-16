import * as React from 'react'

type Memo = <T>(component: T) => T

type ForwardRef = (body: (props: any, ref: any) => React.ReactNode) => any

type SetState<S> = (value: S | ((state: S) => S)) => void

type UseCallback = <T extends (...args: any[]) => any>(callback: T, deps: any[]) => T

type UseContext = <T>(context: React.Context<T>) => T

type UseDebugValue = <T>(value: T, format?: (value: T) => any) => void

type UseEffect = (effect: () => (() => void) | undefined, deps?: any[]) => void

type UseImperativeHandle = (ref: any, init: () => any, deps?: any[]) => void

type UseMemo = <T>(init: () => T, deps?: any[]) => T

type UseReducer = {
  // Normal version:
  <State, Action>(reducer: (state: State | undefined, action: Action) => State, init: State | undefined): [State, (action: Action) => void]

  // Initializer version:
  <State, Action, Init>(reducer: (state: State | undefined, action: Action) => State, init: Init, initializer: (init: Init) => State): [
    State,
    (action: Action) => void
  ]
}

type UseRef = {
  // Value container:
  <T>(init: T): { current: T }
  <T>(): { current: T | undefined }

  // Component ref:
  <T>(init: T | null): { current: T | null }
}

type UseState = <S>(init: S | (() => S)) => [S, SetState<S>]

// @ts-expect-error
export const forwardRef: ForwardRef = React.forwardRef
// @ts-expect-error
export const memo: Memo = React.memo
// @ts-expect-error
export const useCallback: UseCallback = React.useCallback
// @ts-expect-error
export const useContext: UseContext = React.useContext
// @ts-expect-error
export const useDebugValue: UseDebugValue = React.useDebugValue
// @ts-expect-error
export const useEffect: UseEffect = React.useEffect
// @ts-expect-error
export const useImperativeHandle: UseImperativeHandle = React.useImperativeHandle
// @ts-expect-error
export const useLayoutEffect: UseEffect = React.useLayoutEffect
// @ts-expect-error
export const useMemo: UseMemo = React.useMemo
// @ts-expect-error
export const useReducer: UseReducer = React.useReducer
// @ts-expect-error
export const useRef: UseRef = React.useRef
// @ts-expect-error
export const useState: UseState = React.useState
