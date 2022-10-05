import * as React from 'react'
import * as ReactRedux from 'react-redux'

import { Dispatch, RootState } from '../types/reduxTypes'

/**
 * The react-redux connect function, locked to our own Redux types
 * and fixed to take the same parameters as the TypeScript version.
 */
export function connect<StateProps, DispatchProps, OwnProps>(
  mapStateToProps: (state: RootState, ownProps: OwnProps) => StateProps,
  mapDispatchToProps: (dispatch: Dispatch, ownProps: OwnProps) => DispatchProps
  // @ts-expect-error
): (component: React.ComponentType<StateProps & DispatchProps & OwnProps>) => React.FunctionComponent<$Exact<OwnProps>> {
  // @ts-expect-error
  return ReactRedux.connect(mapStateToProps, mapDispatchToProps)
}

type UseDispatch = () => Dispatch

type UseSelector = <T>(selector: (state: RootState) => T) => T

export const useDispatch: UseDispatch = ReactRedux.useDispatch

export const useSelector: UseSelector = ReactRedux.useSelector
