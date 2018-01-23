// @flow

import type { Store as ReduxStore, Dispatch as ReduxDispatch } from 'redux'
import type { AbcContext, AbcCurrencyWallet, AbcAccount, AbcLobby } from 'airbitz-core-types'

export type Action = { type: string, data?: any }

export type CurrencyCode = string
export type Id = string
export type Username = string

export type State = {
  core: {
    account: AbcAccount,
    context: {
      context: AbcContext,
      usernames: Array<Username>,
      nextUsername: Username
    },
    wallets: {
      byId: {
        [Id]: AbcCurrencyWallet
      }
    },
    edgeLogin: {
      lobby: AbcLobby | null,
      error: Error | null,
      isProcessing: boolean
    },
    deepLinking: {
      passwordRecoveryLink: string | null
    }
  },
  ui: any,
  cryptoExchange: any,
  exchangeRates: number
}

type ThunkDispatch<A> = ((Dispatch, GetState) => Promise<void> | void) => A

export type Store = ReduxStore<State, Action>
export type GetState = () => State
export type Dispatch = ReduxDispatch<Action> & ThunkDispatch<Action>
