import { RootState } from '../reducers/RootReducer'
import { Action } from './reduxActions'

export type { Action, RootState }

export type GetState = () => RootState
export type Dispatch = {
  (action: Action): Action
  <Return>(thunk: (dispatch: Dispatch, getState: GetState) => Return): Return
}

export type ThunkAction<Return> = (dispatch: Dispatch, getState: GetState) => Return
