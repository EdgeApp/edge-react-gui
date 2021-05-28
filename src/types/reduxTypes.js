// @flow

import type { Store as ReduxStore } from 'redux'

import { type RootState } from '../reducers/RootReducer.js'
import { type Action } from './reduxActions.js'

export type { Action, RootState }

export type Store = ReduxStore<RootState, Action>
export type Next = $PropertyType<Store, 'dispatch'>

export type GetState = () => RootState
export type Dispatch = <Return>(
  action: Action | ((Dispatch, GetState) => Return)
) => Return
