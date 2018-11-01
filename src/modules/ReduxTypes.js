// @flow

import type { Dispatch as ReduxDispatch, Store as ReduxStore } from 'redux'

import type { PermissionsState } from '../reducers/PermissionsReducer.js'
import type { RootState as State } from '../reducers/scenes/MainReducer.js'
import type { Action } from './Action.js'
import type { Permission, PermissionStatus } from './PermissionsManager.js'

export type CurrencyCode = string
export type Id = string
export type Username = string
export type { PermissionsState, PermissionStatus, Permission }

export type { Action, State }
export type ThunkDispatch<A> = ((Dispatch, GetState) => Promise<void> | void) => A
export type Reducer<S, A: Action> = (S, A) => S
export type Store = ReduxStore<State, Action>
export type Next = $PropertyType<Store, 'dispatch'>
export type GetState = () => State
export type Dispatch = ReduxDispatch<Action> & ThunkDispatch<Action>
