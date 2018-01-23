// @flow

import type { Store as ReduxStore, Dispatch as ReduxDispatch } from 'redux'
import type { AbcContext, AbcCurrencyWallet, AbcCurrencyInfo, AbcAccount, AbcLobby, AbcTransaction } from 'airbitz-core-types'

import type {GuiWallet} from '../types'

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
  cryptoExchange: {
    exchangeRate: number,
    nativeMax: string,
    nativeMin: string,
    minerFee: string,
    reverseExchange: number,
    reverseNativeMax: string,
    reverseNativeMin: string,
    reverseMinerFee: string,
    fromWallet: any, // GuiWallet | null,
    fromCurrencyCode: any, // CurrencyCode | null,
    fromNativeAmount: string,
    fromDisplayAmount: string,
    fromWalletPrimaryInfo: any, // AbcCurrencyInfo | null,
    fromCurrencyIcon: string | null,
    fromCurrencyIconDark: string | null,
    toWallet: any, // GuiWallet | null,
    toCurrencyCode: any, // CurrencyCode | null,
    toNativeAmount: string,
    toDisplayAmount: string,
    toWalletPrimaryInfo: any, // AbcCurrencyInfo | null,
    toCurrencyIcon: string | null,
    toCurrencyIconDark: string | null,
    insufficientError: boolean,
    feeSetting: 'low' | 'standard' | 'high' | 'custom',
    walletListModalVisible: boolean,
    confirmTransactionModalVisible: boolean,
    shiftTransactionError: Error | null,
    genericShapeShiftError: Error | null,
    changeWallet: 'none',
    transaction: AbcTransaction | null,
    fee: any
  },
  exchangeRates: number
}

type ThunkDispatch<A> = ((Dispatch, GetState) => Promise<void> | void) => A

export type Store = ReduxStore<State, Action>
export type GetState = () => State
export type Dispatch = ReduxDispatch<Action> & ThunkDispatch<Action>
