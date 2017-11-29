// @flow
import type {Store as ReduxStore, Dispatch as ReduxDispatch} from 'redux'

export type Action = { type: string, data: any }

export type State = {
  routes: any,
  core: any,
  ui: any,
  cryptoExchange: any,
  exchangeRates: any
}

type ThunkDispatch<A> = ((Dispatch, GetState) => Promise<void> | void) => A;

export type Store = ReduxStore<State, Action>;
export type GetState = () => State;
export type Dispatch = ReduxDispatch<Action> & ThunkDispatch<Action>
