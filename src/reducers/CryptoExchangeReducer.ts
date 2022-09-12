import { Reducer } from 'redux'

import { Action } from '../types/reduxTypes'
import { GuiCurrencyInfo } from '../types/types'

export type CryptoExchangeState = {
  fromWalletId: string | null
  fromCurrencyCode: string | null
  fromNativeAmount: string
  fromDisplayAmount: string
  fromWalletPrimaryInfo: GuiCurrencyInfo // EdgeCurrencyInfo | null,
  fromBalanceMessage: string

  toWalletId: string | null
  toCurrencyCode: string | null
  toNativeAmount: string
  toDisplayAmount: string
  toWalletPrimaryInfo: GuiCurrencyInfo // EdgeCurrencyInfo | null,
  toBalanceMessage: string

  // Errors:
  insufficientError: boolean
  genericShapeShiftError: string | null

  // Activity flags:
  forceUpdateGuiCounter: number
  shiftPendingTransaction: boolean
  calculatingMax: boolean
}

const dummyCurrencyInfo: GuiCurrencyInfo = {
  walletId: '',
  displayCurrencyCode: '',
  exchangeCurrencyCode: '',
  displayDenomination: {
    name: '',
    multiplier: '1'
  },
  exchangeDenomination: {
    name: '',
    multiplier: '1'
  }
}

const initialState: CryptoExchangeState = {
  fromWalletId: null,
  fromCurrencyCode: null,
  fromNativeAmount: '0',
  fromDisplayAmount: '0',
  fromWalletPrimaryInfo: dummyCurrencyInfo,
  fromBalanceMessage: '',

  toWalletId: null,
  toCurrencyCode: null,
  toNativeAmount: '0',
  toDisplayAmount: '0',
  toWalletPrimaryInfo: dummyCurrencyInfo,
  toBalanceMessage: '',

  insufficientError: false,
  genericShapeShiftError: null,
  forceUpdateGuiCounter: 0,
  shiftPendingTransaction: false,
  calculatingMax: false
}

function cryptoExchangeInner(state = initialState, action: Action): CryptoExchangeState {
  let forceUpdateGuiCounter
  switch (action.type) {
    case 'SELECT_FROM_WALLET_CRYPTO_EXCHANGE': {
      return {
        ...state,
        fromWalletId: action.data.walletId,
        fromWalletPrimaryInfo: action.data.primaryInfo,
        fromCurrencyCode: action.data.currencyCode,
        fromBalanceMessage: action.data.balanceMessage,
        fromNativeAmount: '0',
        toNativeAmount: '0',
        fromDisplayAmount: '0',
        toDisplayAmount: '0',
        // @ts-expect-error
        minerFee: '0',
        genericShapeShiftError: null,
        insufficientError: false
      }
    }

    case 'SELECT_TO_WALLET_CRYPTO_EXCHANGE': {
      return {
        ...state,
        toWalletId: action.data.walletId,
        toCurrencyCode: action.data.currencyCode,
        toWalletPrimaryInfo: action.data.primaryInfo,
        toBalanceMessage: action.data.balanceMessage,
        fromNativeAmount: '0',
        toNativeAmount: '0',
        fromDisplayAmount: '0',
        toDisplayAmount: '0',
        // @ts-expect-error
        minerFee: '0',
        genericShapeShiftError: null
      }
    }

    case 'UPDATE_SWAP_QUOTE': {
      return {
        ...state,
        toNativeAmount: action.data.quote.toNativeAmount,
        toDisplayAmount: action.data.toDisplayAmount,
        fromNativeAmount: action.data.quote.fromNativeAmount,
        fromDisplayAmount: action.data.fromDisplayAmount,
        insufficientError: false,
        genericShapeShiftError: null
      }
    }

    case 'RECEIVED_INSUFFICIENT_FUNDS_ERROR': {
      return {
        ...state,
        insufficientError: true,
        genericShapeShiftError: null
      }
    }

    case 'GENERIC_SHAPE_SHIFT_ERROR': {
      return {
        ...state,
        genericShapeShiftError: action.data
      }
    }

    case 'START_SHIFT_TRANSACTION': {
      return {
        ...state,
        shiftPendingTransaction: true
      }
    }

    case 'DONE_SHIFT_TRANSACTION': {
      return {
        ...state,
        shiftPendingTransaction: false
      }
    }

    case 'START_CALC_MAX': {
      return {
        ...state,
        calculatingMax: true
      }
    }

    case 'SET_FROM_WALLET_MAX': {
      forceUpdateGuiCounter = state.forceUpdateGuiCounter
      forceUpdateGuiCounter++
      return {
        ...state,
        fromNativeAmount: action.data,
        calculatingMax: false,
        forceUpdateGuiCounter
      }
    }

    case 'SHIFT_COMPLETE': {
      return { ...initialState }
    }

    default:
      return state
  }
}

// Nuke the state on logout:
export const cryptoExchange: Reducer<CryptoExchangeState, Action> = (state, action: Action) => {
  if (action.type === 'LOGOUT') {
    return cryptoExchangeInner(undefined, { type: 'DUMMY_ACTION_PLEASE_IGNORE' })
  }

  return cryptoExchangeInner(state, action)
}
