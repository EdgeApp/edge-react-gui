// @flow

import { type Reducer } from 'redux'

import { type Action } from '../types/reduxTypes.js'
import { type GuiCurrencyInfo, type GuiWallet } from '../types/types.js'

export type CryptoExchangeState = {
  fromWallet: GuiWallet | null,
  fromCurrencyCode: string | null,
  fromNativeAmount: string,
  fromDisplayAmount: string,
  fromWalletPrimaryInfo: GuiCurrencyInfo, // EdgeCurrencyInfo | null,
  fromCurrencyIcon: string | null,
  fromCurrencyIconDark: string | null,
  fromBalanceMessage: string,

  toWallet: GuiWallet | null,
  toCurrencyCode: string | null,
  toNativeAmount: string,
  toDisplayAmount: string,
  toWalletPrimaryInfo: GuiCurrencyInfo, // EdgeCurrencyInfo | null,
  toCurrencyIcon: string | null,
  toCurrencyIconDark: string | null,
  toBalanceMessage: string,

  // Errors:
  insufficientError: boolean,
  genericShapeShiftError: string | null,

  // Wallet list modal:
  walletListModalVisible: boolean,
  changeWallet: 'none' | 'from' | 'to',

  // Activity flags:
  forceUpdateGuiCounter: number,
  shiftPendingTransaction: boolean,
  calculatingMax: boolean,
  creatingWallet: boolean
}

const dummyCurrencyInfo: GuiCurrencyInfo = {
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
  fromWallet: null,
  fromCurrencyCode: null,
  fromNativeAmount: '0',
  fromDisplayAmount: '0',
  fromWalletPrimaryInfo: dummyCurrencyInfo,
  fromCurrencyIcon: null,
  fromCurrencyIconDark: null,
  fromBalanceMessage: '',

  toWallet: null,
  toCurrencyCode: null,
  toNativeAmount: '0',
  toDisplayAmount: '0',
  toWalletPrimaryInfo: dummyCurrencyInfo,
  toCurrencyIcon: null,
  toCurrencyIconDark: null,
  toBalanceMessage: '',

  insufficientError: false,
  walletListModalVisible: false,
  genericShapeShiftError: null,
  changeWallet: 'none',
  forceUpdateGuiCounter: 0,
  shiftPendingTransaction: false,
  calculatingMax: false,
  creatingWallet: false
}

function cryptoExchangeInner (state = initialState, action: Action): CryptoExchangeState {
  let forceUpdateGuiCounter
  switch (action.type) {
    case 'UI/WALLETS/CREATE_WALLET_START': {
      return { ...state, creatingWallet: true }
    }
    case 'UI/WALLETS/CREATE_WALLET_SUCCESS': {
      return { ...state, creatingWallet: false }
    }
    case 'UI/WALLETS/CREATE_WALLET_FAILURE': {
      return { ...state, creatingWallet: false }
    }

    case 'SELECT_FROM_WALLET_CRYPTO_EXCHANGE': {
      if (!action.data) throw new Error('Invalid action')
      return {
        ...state,
        fromWallet: action.data.wallet,
        fromWalletPrimaryInfo: action.data.primaryInfo,
        fromCurrencyCode: action.data.currencyCode,
        fromCurrencyIcon: getLogo(action.data.wallet, action.data.currencyCode),
        fromCurrencyIconDark: getLogoDark(action.data.wallet, action.data.currencyCode),
        fromBalanceMessage: action.data.balanceMessage,
        changeWallet: 'none',
        fromNativeAmount: '0',
        toNativeAmount: '0',
        fromDisplayAmount: '0',
        toDisplayAmount: '0',
        minerFee: '0',
        genericShapeShiftError: null
      }
    }

    case 'SELECT_TO_WALLET_CRYPTO_EXCHANGE': {
      if (!action.data) throw new Error('Invalid action')
      return {
        ...state,
        toWallet: action.data.wallet,
        toCurrencyCode: action.data.currencyCode,
        toWalletPrimaryInfo: action.data.primaryInfo,
        toCurrencyIcon: getLogo(action.data.wallet, action.data.currencyCode),
        toCurrencyIconDark: getLogoDark(action.data.wallet, action.data.currencyCode),
        toBalanceMessage: action.data.balanceMessage,
        changeWallet: 'none',
        fromNativeAmount: '0',
        toNativeAmount: '0',
        fromDisplayAmount: '0',
        toDisplayAmount: '0',
        minerFee: '0',
        genericShapeShiftError: null
      }
    }
    case 'OPEN_WALLET_SELECTOR_MODAL': {
      return {
        ...state,
        walletListModalVisible: true,
        changeWallet: action.data
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

    case 'RECEIVED_INSUFFICENT_FUNDS_ERROR': {
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

function getLogo (wallet, currencyCode) {
  if (currencyCode === wallet.currencyCode) return wallet.symbolImage
  for (let i = 0; i < wallet.metaTokens.length; i++) {
    const obj = wallet.metaTokens[i]
    if (obj.symbolImage && obj.currencyCode === currencyCode) {
      return obj.symbolImage
    }
  }
  return null
}

function getLogoDark (wallet, currencyCode) {
  if (currencyCode === wallet.currencyCode) return wallet.symbolImageDarkMono
  for (let i = 0; i < wallet.metaTokens.length; i++) {
    const obj = wallet.metaTokens[i]
    if (obj.symbolImage && obj.currencyCode === currencyCode) {
      return obj.symbolImage
    }
  }
  return null
}

// Nuke the state on logout:
export const cryptoExchange: Reducer<CryptoExchangeState, Action> = (state, action: Action) => {
  if (action.type === 'LOGOUT' || action.type === 'DEEP_LINK_RECEIVED') {
    return cryptoExchangeInner(undefined, { type: 'DUMMY_ACTION_PLEASE_IGNORE' })
  }

  return cryptoExchangeInner(state, action)
}
