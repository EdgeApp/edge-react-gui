// @flow

import * as Constants from '../constants/indexConstants'
import s from '../locales/strings.js'
import type { State } from '../modules/ReduxTypes.js'
import type { GuiCurrencyInfo } from '../types.js'

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

const initialState = {
  exchangeRate: 1,
  nativeMax: '0',
  nativeMin: '0',
  minerFee: '0',
  reverseExchange: 1,
  reverseNativeMax: '0',
  reverseNativeMin: '0',
  reverseMinerFee: '0',

  fromWallet: null,
  fromCurrencyCode: null,
  fromNativeAmount: '0',
  fromDisplayAmount: '0',
  fromWalletPrimaryInfo: dummyCurrencyInfo,
  fromCurrencyIcon: null,
  fromCurrencyIconDark: null,

  toWallet: null,
  toCurrencyCode: null,
  toNativeAmount: '0',
  toDisplayAmount: '0',
  toWalletPrimaryInfo: dummyCurrencyInfo,
  toCurrencyIcon: null,
  toCurrencyIconDark: null,

  fee: 0,
  insufficientError: false,
  feeSetting: Constants.STANDARD_FEE,
  walletListModalVisible: false,
  confirmTransactionModalVisible: false,
  shiftTransactionError: null,
  genericShapeShiftError: null,
  changeWallet: Constants.NONE,
  forceUpdateGuiCounter: 0,
  transaction: null,
  gettingTransaction: false,
  availableShapeShiftTokens: [],
  shiftPendingTransaction: false,
  quoteExpireDate: null
}

function cryptoExchangerReducer (state = initialState, action) {
  let forceUpdateGuiCounter
  switch (action.type) {
    case Constants.SWAP_FROM_TO_CRYPTO_WALLETS:
      return deepCopyState(state)
    case Constants.SELECT_FROM_WALLET_CRYPTO_EXCHANGE:
      return {
        ...state,
        fromWallet: action.data.wallet,
        fromWalletPrimaryInfo: action.data.primaryInfo,
        fromCurrencyCode: action.data.currencyCode,
        fromCurrencyIcon: getLogo(action.data.wallet, action.data.currencyCode),
        fromCurrencyIconDark: getLogoDark(action.data.wallet, action.data.currencyCode),
        changeWallet: Constants.NONE,
        fromNativeAmount: '0',
        toNativeAmount: '0',
        fromDisplayAmount: '0',
        toDisplayAmount: '0',
        minerFee: '0',
        fee: '',
        exchangeRate: 1,
        transaction: null,
        quoteExpireDate: null
      }
    case Constants.SELECT_TO_WALLET_CRYPTO_EXCHANGE:
      return {
        ...state,
        toWallet: action.data.wallet,
        toCurrencyCode: action.data.currencyCode,
        toWalletPrimaryInfo: action.data.primaryInfo,
        toCurrencyIcon: getLogo(action.data.wallet, action.data.currencyCode),
        toCurrencyIconDark: getLogoDark(action.data.wallet, action.data.currencyCode),
        changeWallet: Constants.NONE,
        fromNativeAmount: '0',
        toNativeAmount: '0',
        fromDisplayAmount: '0',
        toDisplayAmount: '0',
        minerFee: '0',
        fee: '',
        exchangeRate: 1,
        transaction: null,
        quoteExpireDate: null
      }
    case Constants.DISABLE_WALLET_LIST_MODAL_VISIBILITY:
      return { ...state, walletListModalVisible: false }
    case Constants.OPEN_WALLET_SELECTOR_MODAL:
      return {
        ...state,
        walletListModalVisible: true,
        changeWallet: action.data
      }
    case Constants.UPDATE_CRYPTO_EXCHANGE_INFO: {
      const result = {
        ...state,
        exchangeRate: action.data.rate,
        nativeMin: action.data.nativeMin,
        nativeMax: action.data.nativeMax,
        minerFee: action.data.minerFee
      }
      return result
    }
    case Constants.UPDATE_CRYPTO_REVERSE_EXCHANGE_INFO: {
      const result = {
        ...state,
        reverseExchange: action.data.rate,
        reverseNativeMin: action.data.nativeMin,
        reverseNativeMax: action.data.nativeMax,
        reverseMinerFee: action.data.minerFee
      }
      return result
    }
    case Constants.UPDATE_SHIFT_TRANSACTION:
      return {
        ...state,
        transaction: action.data.edgeTransaction,
        toNativeAmount: action.data.toNativeAmount,
        toDisplayAmount: action.data.toDisplayAmount,
        fromNativeAmount: action.data.fromNativeAmount,
        fromDisplayAmount: action.data.fromDisplayAmount,
        quoteExpireDate: action.data.quoteExpireDate,
        fee:
          action.data.networkFee && state.fromCurrencyCode
            ? s.strings.string_fee_with_colon + ' ' + action.data.networkFee + ' ' + state.fromWalletPrimaryInfo.displayDenomination.name
            : ' ',
        insufficientError: false,
        genericShapeShiftError: null
      }
    case Constants.INVALIDATE_SHIFT_TRANSACTION:
      return {
        ...state,
        transaction: null,
        insufficientError: false,
        genericShapeShiftError: null,
        quoteExpireDate: null
      }
    case Constants.SHIFT_COMPLETE:
      return { ...initialState, availableShapeShiftTokens: state.availableShapeShiftTokens }
    case Constants.SHIFT_ERROR:
      return {
        ...state,
        confirmTransactionModalVisible: false,
        shiftTransactionError: action.data
      }
    case Constants.CLOSE_CRYPTO_EXC_CONF_MODAL:
      return { ...state, confirmTransactionModalVisible: false }
    case Constants.OPEN_CRYPTO_EXC_CONF_MODAL:
      return { ...state, confirmTransactionModalVisible: true }
    case Constants.SET_CRYPTO_EXCHANGE_AMOUNTS:
      forceUpdateGuiCounter = state.forceUpdateGuiCounter
      if (action.data.forceUpdateGui) {
        forceUpdateGuiCounter++
      }
      const toNativeAmount = action.data.toNativeAmount || undefined
      const toDisplayAmount = action.data.toDisplayAmount || undefined
      const fromNativeAmount = action.data.fromNativeAmount || undefined
      const fromDisplayAmount = action.data.fromDisplayAmount || undefined

      return {
        ...state,
        toNativeAmount,
        toDisplayAmount,
        fromNativeAmount,
        fromDisplayAmount,
        forceUpdateGuiCounter
      }
    case Constants.RECEIVED_INSUFFICIENT_FUNDS_ERROR:
      return {
        ...state,
        transaction: null,
        insufficientError: true,
        genericShapeShiftError: null,
        shiftTransactionError: null
      }
    case Constants.GENERIC_SHAPE_SHIFT_ERROR:
      return {
        ...state,
        transaction: null,
        genericShapeShiftError: action.data,
        shiftTransactionError: null
      }
    case Constants.CHANGE_EXCHANGE_FEE:
      return {
        ...state,
        feeSetting: action.data.feeSetting,
        forceUpdateGuiCounter: state.forceUpdateGuiCounter + 1
      }
    case Constants.START_MAKE_SPEND:
      return {
        ...state,
        gettingTransaction: true,
        insufficientError: false,
        genericShapeShiftError: null,
        shiftTransactionError: null,
        quoteExpireDate: null
      }
    case Constants.ON_AVAILABLE_SHAPE_SHIFT_TOKENS:
      return { ...state, availableShapeShiftTokens: action.data }
    case Constants.DONE_MAKE_SPEND:
      return { ...state, gettingTransaction: false }
    case Constants.START_SHIFT_TRANSACTION:
      return { ...state, shiftPendingTransaction: true }
    case Constants.DONE_SHIFT_TRANSACTION:
      return { ...state, shiftPendingTransaction: false }
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

function deepCopyState (state) {
  const deepCopy = JSON.parse(JSON.stringify(state))
  deepCopy.toWallet = state.fromWallet
  deepCopy.toCurrencyCode = state.fromCurrencyCode
  deepCopy.toNativeAmount = '0'
  deepCopy.toDisplayAmount = '0'
  deepCopy.toWalletPrimaryInfo = state.fromWalletPrimaryInfo
  deepCopy.toCurrencyIcon = state.fromCurrencyIcon
  deepCopy.toCurrencyIconDark = state.fromCurrencyIconDark
  deepCopy.fromWallet = state.toWallet
  deepCopy.fromCurrencyCode = state.toCurrencyCode
  deepCopy.fromNativeAmount = '0'
  deepCopy.fromDisplayAmount = '0'
  deepCopy.fromWalletPrimaryInfo = state.toWalletPrimaryInfo
  deepCopy.fromCurrencyIcon = state.toCurrencyIcon
  deepCopy.fromCurrencyIconDark = state.toCurrencyIconDark

  deepCopy.exchangeRate = state.reverseExchange
  deepCopy.reverseExchange = state.exchangeRate

  deepCopy.nativeMin = state.reverseNativeMin
  deepCopy.reverseNativeMin = state.nativeMin

  deepCopy.nativeMax = state.reverseNativeMax
  deepCopy.reverseNativeMax = state.nativeMax

  deepCopy.minerFee = state.reverseMinerFee
  deepCopy.reverseMinerFee = state.minerFee
  deepCopy.forceUpdateGuiCounter = state.forceUpdateGuiCounter + 1

  deepCopy.insufficientError = false

  return deepCopy
}

// Nuke the state on logout:
export const cryptoExchanger = (state: $PropertyType<State, 'cryptoExchange'>, action: any): $PropertyType<State, 'cryptoExchange'> => {
  if (action.type === Constants.LOGOUT || action.type === Constants.DEEP_LINK_RECEIVED) {
    return cryptoExchangerReducer(undefined, { type: 'DUMMY_ACTION_PLEASE_IGNORE' })
  }

  return cryptoExchangerReducer(state, action)
}

export default cryptoExchanger
