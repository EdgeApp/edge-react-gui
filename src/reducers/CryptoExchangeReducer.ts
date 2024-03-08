import { Reducer } from 'redux'

import { Action } from '../types/reduxTypes'
import { emptyCurrencyInfo, GuiCurrencyInfo } from '../types/types'

export interface CryptoExchangeState {
  fromWalletId: string | null
  fromNativeAmount: string
  fromWalletPrimaryInfo: GuiCurrencyInfo // EdgeCurrencyInfo | null,

  toWalletId: string | null
  toNativeAmount: string
  toWalletPrimaryInfo: GuiCurrencyInfo // EdgeCurrencyInfo | null,

  // Errors:
  insufficientError: boolean
  genericShapeShiftError: string | null

  // Activity flags:
  shiftPendingTransaction: boolean
}

const initialState: CryptoExchangeState = {
  fromWalletId: null,
  fromNativeAmount: '0',
  fromWalletPrimaryInfo: emptyCurrencyInfo,

  toWalletId: null,
  toNativeAmount: '0',
  toWalletPrimaryInfo: emptyCurrencyInfo,

  insufficientError: false,
  genericShapeShiftError: null,
  shiftPendingTransaction: false
}

function cryptoExchangeInner(state = initialState, action: Action): CryptoExchangeState {
  switch (action.type) {
    case 'SELECT_FROM_WALLET_CRYPTO_EXCHANGE': {
      return {
        ...state,
        fromWalletId: action.data.walletId,
        fromWalletPrimaryInfo: action.data.primaryInfo,
        fromNativeAmount: '0',
        toNativeAmount: '0',
        genericShapeShiftError: null,
        insufficientError: false
      }
    }

    case 'SELECT_TO_WALLET_CRYPTO_EXCHANGE': {
      return {
        ...state,
        toWalletId: action.data.walletId,
        toWalletPrimaryInfo: action.data.primaryInfo,
        fromNativeAmount: '0',
        toNativeAmount: '0',
        genericShapeShiftError: null
      }
    }

    case 'UPDATE_SWAP_QUOTE': {
      return {
        ...state,
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
