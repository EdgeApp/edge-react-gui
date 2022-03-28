// @flow

import { hook } from 'cavy'
import * as React from 'react'
import * as ReactRedux from 'react-redux'

import { type Dispatch, type RootState } from '../types/reduxTypes.js'

export type TestProps = {
  generateTestHook: (id: string, ref: any) => void
}

/**
 * The react-redux connect function, locked to our own Redux types
 * and fixed to take the same type parameters as the TypeScript version.
 */
export function connect<StateProps, DispatchProps, OwnProps>(
  mapStateToProps: (state: RootState, ownProps: OwnProps) => StateProps,
  mapDispatchToProps: (dispatch: Dispatch, ownProps: OwnProps) => DispatchProps
): (component: React.ComponentType<StateProps & DispatchProps & OwnProps>) => React.StatelessFunctionalComponent<$Exact<{ ...TestProps, ...OwnProps }>> {
  // $FlowFixMe
  return component => ReactRedux.connect(mapStateToProps, mapDispatchToProps)(hook(component))
}

type UseDispatch = () => Dispatch

type UseSelector = <T>((state: RootState) => T) => T

// $FlowFixMe
export const useDispatch: UseDispatch = ReactRedux.useDispatch
// $FlowFixMe
export const useSelector: UseSelector = ReactRedux.useSelector
