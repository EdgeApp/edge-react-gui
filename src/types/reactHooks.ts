import * as React from 'react'

type SetState<S> = (value: S | ((state: S) => S)) => void

type UseCallback = <T extends (...args: any[]) => any>(callback: T, deps: any[]) => T

type UseContext = <T>(context: React.Context<T>) => T

type UseDebugValue = <T>(value: T, format?: (value: T) => any) => void

type UseEffect = (effect: () => (() => void) | undefined, deps?: any[]) => void

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

export const useCallback: UseCallback = React.useCallback

export const useContext: UseContext = React.useContext

export const useDebugValue: UseDebugValue = React.useDebugValue

export const useEffect: UseEffect = React.useEffect

export const useLayoutEffect: UseEffect = React.useLayoutEffect

export const useMemo: UseMemo = React.useMemo

export const useReducer: UseReducer = React.useReducer

export const useRef: UseRef = React.useRef

export const useState: UseState = React.useState
