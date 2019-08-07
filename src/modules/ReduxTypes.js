// @flow

import type { Store as ReduxStore } from 'redux'

import { type RootState as State } from '../reducers/RootReducer.js'
import { type Action } from './Action.js'

export type { Action, State }

export type Store = ReduxStore<State, Action>
export type Next = $PropertyType<Store, 'dispatch'>

export type GetState = () => State
export type Dispatch = <Return>(action: Action | ((Dispatch, GetState) => Return)) => Return
