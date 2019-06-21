// @flow

import type { Dispatch as ReduxDispatch, Store as ReduxStore } from 'redux'

import { type RootState as State } from '../reducers/RootReducer.js'
import { type Action } from './Action.js'

export type CurrencyCode = string
export type Id = string
export type Username = string

export type { Action, State }
export type ThunkDispatch<A> = ((Dispatch, GetState) => Promise<void> | void) => A
export type Store = ReduxStore<State, Action>
export type Next = $PropertyType<Store, 'dispatch'>
export type GetState = () => State
export type Dispatch = ReduxDispatch<Action> & ThunkDispatch<Action>
