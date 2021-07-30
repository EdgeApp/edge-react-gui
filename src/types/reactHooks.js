// @flow

import * as React from 'react'
import * as ReactRedux from 'react-redux'

import { type Dispatch, type RootState, type ShallowEqual } from '../../types/reduxTypes'

type SetState<S> = (value: S | ((state: S) => S)) => void

type UseCallback = <T: (...args: any[]) => any>(callback: T, deps: any[]) => T

type UseContext = <T>(context: React.Context<T>) => T

type UseDebugValue = <T>(value: T, format?: (value: T) => any) => void

type UseEffect = (effect: () => void | (() => void), deps?: any[]) => void

type UseImperativeHandle = (ref: any, init: () => any, deps?: any[]) => void

type UseMemo = <T>(init: () => T, deps?: any[]) => T

type UseDispatch = () => Dispatch

type UseSelector = ((state: RootState) => any, shallowEqual?: ShallowEqual) => any

type UseReducer = {
  // Normal version:
  <State, Action>(reducer: (state: State | void, action: Action) => State, init: State | void): [State, (action: Action) => void],

  // Initializer version:
  <State, Action, Init>(
    reducer: (state: State | void, action: Action) => State,
    init: Init,
    initializer: (init: Init) => State
  ): [State, (action: Action) => void]
}

type UseRef = {
  // Component ref:
  <ElementType: React$ElementType>(): { current: null | React$ElementRef<ElementType> },

  // Value container:
  <T>(init: T): { current: T }
}

type UseState = <S>(init: S | (() => S)) => [S, SetState<S>]

// $FlowFixMe
export const useCallback: UseCallback = React.useCallback
// $FlowFixMe
export const useContext: UseContext = React.useContext
// $FlowFixMe
export const useDebugValue: UseDebugValue = React.useDebugValue
// $FlowFixMe
export const useEffect: UseEffect = React.useEffect
// $FlowFixMe
export const useImperativeHandle: UseImperativeHandle = React.useImperativeHandle
// $FlowFixMe
export const useLayoutEffect: UseEffect = React.useLayoutEffect
// $FlowFixMe
export const useMemo: UseMemo = React.useMemo
// $FlowFixMe
export const useReducer: UseReducer = React.useReducer
// $FlowFixMe
export const useRef: UseRef = React.useRef
// $FlowFixMe
export const useState: UseState = React.useState

// react-redux hooks --------------------------------------------------

// $FlowFixMe
export const useDispatch: UseDispatch = ReactRedux.useDispatch
// $FlowFixMe
export const useSelector: UseSelector = ReactRedux.useSelector
