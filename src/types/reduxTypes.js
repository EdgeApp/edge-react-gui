// @flow

import { type RootState } from '../reducers/RootReducer.js'
import { type Action } from './reduxActions.js'

export type { Action, RootState }

export type GetState = () => RootState
export type Dispatch = <Return>(action: Action | ((Dispatch, GetState) => Return)) => Return
