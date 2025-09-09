import type * as Redux from 'redux'

import type { RootState } from '../reducers/RootReducer'
import type { Action } from './reduxActions'

export type { Action, RootState }

export type GetState = () => RootState

export interface Dispatch {
  (action: Action): Action
  <Return>(thunk: ThunkAction<Return>): Return
}

export interface Store extends Redux.Store<RootState, Action> {
  dispatch: Dispatch
}

export type ThunkAction<Return> = (
  dispatch: Dispatch,
  getState: GetState
) => Return
