// @flow

import { type RootState } from '../reducers/RootReducer.js'
import { type Action } from './reduxActions.js'

export type { Action, RootState }

export type GetState = () => RootState

export type ShallowEqual = (prevProps: any, nextProps: any) => boolean
export type Dispatch = {
  (action: Action): Action,
  <Return>(thunk: (dispatch: Dispatch, getState: GetState) => Return): Return
}
