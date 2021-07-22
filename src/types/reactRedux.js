// @flow

import * as React from 'react'
import * as ReactRedux from 'react-redux'

import { type Dispatch, type RootState } from '../types/reduxTypes.js'

/**
 * The react-redux connect function, locked to our own Redux types
 * and fixed to take the same type parameters as the TypeScript version.
 */
export function connect<StateProps, DispatchProps, OwnProps>(
  mapStateToProps: (state: RootState, ownProps: OwnProps) => StateProps,
  mapDispatchToProps: (dispatch: Dispatch, ownProps: OwnProps) => DispatchProps
): (component: React.ComponentType<StateProps & DispatchProps & OwnProps>) => (props: OwnProps) => React.Node {
  // $FlowFixMe
  return ReactRedux.connect(mapStateToProps, mapDispatchToProps)
}

type UseDispatch = () => Dispatch

type UseSelector = <T>((state: RootState) => T) => T

// $FlowFixMe
export const useDispatch: UseDispatch = ReactRedux.useDispatch
// $FlowFixMe
export const useSelector: UseSelector = ReactRedux.useSelector
