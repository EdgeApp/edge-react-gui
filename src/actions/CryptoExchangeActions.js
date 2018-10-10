// @flow

import { bns } from 'biggystring'
import type { EdgeCurrencyWallet, EdgeExchangeQuote, EdgeExchangeQuoteOptions, EdgeMetadata, EdgeSpendInfo } from 'edge-core-js'
import { errorNames } from 'edge-core-js'
import { Alert } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { sprintf } from 'sprintf-js'

import * as Constants from '../constants/indexConstants'
import s from '../locales/strings.js'
import * as CONTEXT_API from '../modules/Core/Context/api'
import * as CORE_SELECTORS from '../modules/Core/selectors'
import * as WALLET_API from '../modules/Core/Wallets/api.js'
import type { Dispatch, GetState } from '../modules/ReduxTypes'
import * as UI_SELECTORS from '../modules/UI/selectors'
import * as SETTINGS_SELECTORS from '../modules/UI/Settings/selectors.js'
import * as UTILS from '../modules/utils'
import type { GuiCurrencyInfo, GuiDenomination, GuiWallet } from '../types'

const DIVIDE_PRECISION = 18

export type SetNativeAmountInfo = {
  whichWallet: string,
  primaryExchangeAmount: string,
  primaryNativeAmount: string,
  fromPrimaryInfo?: GuiCurrencyInfo,
  toPrimaryInfo?: GuiCurrencyInfo
}

function setFromWalletMax (amount: string) {
  return {
    type: 'SET_FROM_WALLET_MAX',
    data: amount
  }
}

function setShapeTransaction (
  type: 'UPDATE_SHIFT_TRANSACTION_FEE',
  data: {
    quote: EdgeExchangeQuote,
    fromNativeAmount: string, // This needs to be calculated
    fromDisplayAmount: string,
    toNativeAmount: string,
    toDisplayAmount: string,
    quoteExpireDate: number
  }
) {
  return {
    type,
    data
  }
}

export const getQuoteForTransaction = (info: SetNativeAmountInfo) => async (dispatch: Dispatch, getState: GetState) => {
  Actions[Constants.EXCHANGE_QUOTE_PROCESSING_SCENE]()
  const state = getState()
  const fromWallet: GuiWallet | null = state.cryptoExchange.fromWallet
  const toWallet: GuiWallet | null = state.cryptoExchange.toWallet
  // dispatch(actions.setNativeAmount(info, false))
  makeShiftTransaction(dispatch, fromWallet, toWallet, info.whichWallet, info)
}

export const exchangeMax = () => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const fromWallet = state.cryptoExchange.fromWallet
  if (!fromWallet) {
    return
  }
  const wallet: EdgeCurrencyWallet = CORE_SELECTORS.getWallet(state, fromWallet.id)
  const receiveAddress = await wallet.getReceiveAddress()
  const currencyCode = state.cryptoExchange.fromCurrencyCode ? state.cryptoExchange.fromCurrencyCode : undefined

  const edgeSpendInfo: EdgeSpendInfo = {
    networkFeeOption: state.cryptoExchange.feeSetting,
    currencyCode,
    spendTargets: [
      {
        publicAddress: receiveAddress.publicAddress
      }
    ]
  }
  const primaryNativeAmount = await wallet.getMaxSpendable(edgeSpendInfo)
  dispatch(setFromWalletMax(primaryNativeAmount))
}

async function makeShiftTransaction (
  dispatch: Dispatch,
  fromWallet: GuiWallet | null,
  toWallet: GuiWallet | null,
  whichWallet: string,
  info: SetNativeAmountInfo
) {
  if (fromWallet && toWallet) {
    try {
      await dispatch(getShiftTransaction(fromWallet, toWallet, whichWallet, info))
    } catch (e) {
      dispatch(processMakeSpendError(e))
    }
  }
}
const processMakeSpendError = e => (dispatch: Dispatch, getState: GetState) => {
  console.log(e)
  Actions.popTo(Constants.EXCHANGE_SCENE)
  if (e.name === errorNames.InsufficientFundsError || e.message === Constants.INSUFFICIENT_FUNDS) {
    dispatch({ type: 'RECEIVED_INSUFFICENT_FUNDS_ERROR' })
    return
  }
  dispatch({ type: 'GENERIC_SHAPE_SHIFT_ERROR', data: e.message })
}

export const shiftCryptoCurrency = () => async (dispatch: Dispatch, getState: GetState) => {
  dispatch({ type: 'START_SHIFT_TRANSACTION' })
  const state = getState()
  const quote = state.cryptoExchange.quote
  const fromWallet = state.cryptoExchange.fromWallet
  const toWallet = state.cryptoExchange.toWallet
  if (!quote || !fromWallet || !toWallet) {
    dispatch({ type: 'DONE_SHIFT_TRANSACTION' })
    return
  }
  const srcWallet: EdgeCurrencyWallet = CORE_SELECTORS.getWallet(state, fromWallet.id)

  if (!srcWallet) {
    dispatch({ type: 'DONE_SHIFT_TRANSACTION' })
    return
  }
  if (srcWallet) {
    try {
      global.firebase && global.firebase.analytics().logEvent(`Exchange_Shift_Start`)
      const broadcastedTransaction = await quote.approve()
      await WALLET_API.saveTransaction(srcWallet, broadcastedTransaction)

      const category = sprintf(
        '%s:%s %s %s',
        s.strings.fragment_transaction_exchange,
        state.cryptoExchange.fromCurrencyCode,
        s.strings.word_to_in_convert_from_to_string,
        state.cryptoExchange.toCurrencyCode
      )
      const shapeShiftOrderId = quote && quote.quoteUri ? quote.quoteUri : ''
      const notes = sprintf(
        s.strings.exchange_notes_metadata,
        state.cryptoExchange.fromDisplayAmount,
        state.cryptoExchange.fromWalletPrimaryInfo.displayDenomination.name,
        fromWallet.name,
        state.cryptoExchange.toDisplayAmount,
        state.cryptoExchange.toWalletPrimaryInfo.displayDenomination.name,
        toWallet.name,
        shapeShiftOrderId
      )

      const edgeMetaData: EdgeMetadata = {
        name: 'ShapeShift',
        category,
        notes
      }
      Actions.popTo(Constants.EXCHANGE_SCENE)
      await WALLET_API.setTransactionDetailsRequest(srcWallet, broadcastedTransaction.txid, broadcastedTransaction.currencyCode, edgeMetaData)

      dispatch({ type: 'SHIFT_COMPLETE' })
      setTimeout(() => {
        Alert.alert(s.strings.exchange_succeeded, s.strings.exchanges_may_take_minutes)
      }, 1)
      global.firebase && global.firebase.analytics().logEvent(`Exchange_Shift_Success`)
    } catch (error) {
      global.firebase && global.firebase.analytics().logEvent(`Exchange_Shift_Failed`)
      dispatch({ type: 'SHIFT_ERROR', data: error.message })
      dispatch({ type: 'DONE_SHIFT_TRANSACTION' })
      setTimeout(() => {
        Alert.alert(s.strings.exchange_failed, error.message)
      }, 1)
    }
  }
}

const getShiftTransaction = (fromWallet: GuiWallet, toWallet: GuiWallet, whichWallet: string = Constants.FROM, info: SetNativeAmountInfo) => async (
  dispatch: Dispatch,
  getState: GetState
) => {
  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  const destWallet = CORE_SELECTORS.getWallet(state, toWallet.id)
  const srcWallet: EdgeCurrencyWallet = CORE_SELECTORS.getWallet(state, fromWallet.id)
  const fromNativeAmount = info.primaryNativeAmount
  const { nativeMax, nativeMin } = state.cryptoExchange
  const fromCurrencyCode = state.cryptoExchange.fromCurrencyCode ? state.cryptoExchange.fromCurrencyCode : undefined
  const toCurrencyCode = state.cryptoExchange.toCurrencyCode ? state.cryptoExchange.toCurrencyCode : undefined

  if (!fromCurrencyCode || !toCurrencyCode) {
    // this funciton is solely for flow
    return
  }
  const isAboveLimit = bns.gt(fromNativeAmount, nativeMax)
  const isBelowLimit = bns.lt(fromNativeAmount, nativeMin)

  if (isAboveLimit) {
    const settings = SETTINGS_SELECTORS.getSettings(state)
    const currentCurrencyDenomination = SETTINGS_SELECTORS.getDisplayDenominationFromSettings(settings, fromCurrencyCode)

    const displayDenomination = SETTINGS_SELECTORS.getDisplayDenomination(state, fromCurrencyCode)
    // $FlowFixMe
    const nativeToDisplayRatio = displayDenomination.multiplier
    const displayMax = UTILS.convertNativeToDisplay(nativeToDisplayRatio)(nativeMax)
    const errorMessage = sprintf(s.strings.amount_above_limit, displayMax, currentCurrencyDenomination.name)
    console.log(`getShiftTransaction:above limit`)
    dispatch({ type: 'GENERIC_SHAPE_SHIFT_ERROR', data: errorMessage })
    Actions.popTo(Constants.EXCHANGE_SCENE)
    return
  }
  if (isBelowLimit) {
    const settings = SETTINGS_SELECTORS.getSettings(state)
    const currentCurrencyDenomination = SETTINGS_SELECTORS.getDisplayDenominationFromSettings(settings, fromCurrencyCode)

    const displayDenomination = SETTINGS_SELECTORS.getDisplayDenomination(state, fromCurrencyCode)
    // $FlowFixMe
    const nativeToDisplayRatio = displayDenomination.multiplier
    const displayMin = UTILS.convertNativeToDisplay(nativeToDisplayRatio)(nativeMin)
    const errorMessage = sprintf(s.strings.amount_below_limit, displayMin, currentCurrencyDenomination.name)
    console.log(`getShiftTransaction:below limit`)
    dispatch({ type: 'GENERIC_SHAPE_SHIFT_ERROR', data: errorMessage })
    Actions.popTo(Constants.EXCHANGE_SCENE)
    return
  }

  const quoteNativeAmount = fromNativeAmount
  const whichWalletLiteral = whichWallet === Constants.TO ? 'to' : 'from'
  const quoteData: EdgeExchangeQuoteOptions = {
    fromCurrencyCode,
    fromWallet: srcWallet,
    nativeAmount: quoteNativeAmount,
    quoteFor: whichWalletLiteral,
    toCurrencyCode,
    toWallet: destWallet
  }

  let error
  let edgeCoinExchangeQuote
  try {
    edgeCoinExchangeQuote = await account.getExchangeQuote(quoteData)
  } catch (e) {
    if (e.message === 'InsufficientFundsError') {
      dispatch(processMakeSpendError(e))
      return
    }
    error = e
  }

  if (error || !edgeCoinExchangeQuote) {
    console.log('stop')
    throw error
  }

  const fromPrimaryInfo = state.cryptoExchange.fromWalletPrimaryInfo
  const toPrimaryInfo = state.cryptoExchange.toWalletPrimaryInfo

  const fromDisplayAmountTemp = bns.div(edgeCoinExchangeQuote.fromNativeAmount, fromPrimaryInfo.displayDenomination.multiplier, DIVIDE_PRECISION)
  const fromDisplayAmount = bns.toFixed(fromDisplayAmountTemp, 0, 8)
  const toDisplayAmountTemp = bns.div(edgeCoinExchangeQuote.toNativeAmount, toPrimaryInfo.displayDenomination.multiplier, DIVIDE_PRECISION)
  const toDisplayAmount = bns.toFixed(toDisplayAmountTemp, 0, 8)
  const returnObject = {
    quote: edgeCoinExchangeQuote,
    fromNativeAmount: edgeCoinExchangeQuote.fromNativeAmount, // This needs to be calculated
    fromDisplayAmount: fromDisplayAmount,
    toNativeAmount: edgeCoinExchangeQuote.toNativeAmount,
    toDisplayAmount: toDisplayAmount,
    quoteExpireDate: edgeCoinExchangeQuote.expirationDate
  }
  Actions[Constants.EXCHANGE_QUOTE_SCENE]()
  dispatch(setShapeTransaction('UPDATE_SHIFT_TRANSACTION_FEE', returnObject))
}

export const selectToFromWallet = (type: string, wallet: GuiWallet, currencyCode?: string) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const cc = currencyCode || wallet.currencyCode

  // $FlowFixMe
  const primaryDisplayDenomination: GuiDenomination = SETTINGS_SELECTORS.getDisplayDenomination(state, cc)
  const primaryExchangeDenomination: GuiDenomination = UI_SELECTORS.getExchangeDenomination(state, cc, wallet)
  const primaryInfo: GuiCurrencyInfo = {
    displayCurrencyCode: cc,
    exchangeCurrencyCode: cc,
    displayDenomination: primaryDisplayDenomination,
    exchangeDenomination: primaryExchangeDenomination
  }

  const data = {
    wallet,
    currencyCode: cc,
    primaryInfo
  }

  let fromCurrencyCode = state.cryptoExchange.fromCurrencyCode
  let toCurrencyCode = state.cryptoExchange.toCurrencyCode
  if (type === 'SELECT_FROM_WALLET_CRYPTO_EXCHANGE') {
    dispatch({ type: 'SELECT_FROM_WALLET_CRYPTO_EXCHANGE', data })
    fromCurrencyCode = cc
  } else {
    dispatch({ type: 'SELECT_TO_WALLET_CRYPTO_EXCHANGE', data })
    toCurrencyCode = cc
  }

  if (fromCurrencyCode && toCurrencyCode) {
    dispatch(getCryptoExchangeRate(fromCurrencyCode, toCurrencyCode))
  }
}

export const getCryptoExchangeRate = (fromCurrencyCode: string, toCurrencyCode: string) => (dispatch: Dispatch, getState: GetState) => {
  if (fromCurrencyCode === toCurrencyCode) {
    dispatch({ type: 'UPDATE_CRYPTO_EXCHANGE_RATE', data: 1 })
    return
  }

  if (!fromCurrencyCode || !toCurrencyCode) {
    dispatch({ type: 'UPDATE_CRYPTO_EXCHANGE_RATE', data: 1 })
    return
  }

  const state = getState()
  const context = CORE_SELECTORS.getContext(state)
  CONTEXT_API.getExchangeSwapInfo(context, fromCurrencyCode, toCurrencyCode)
    .then(response => {
      dispatch({ type: 'UPDATE_CRYPTO_EXCHANGE_INFO', data: response })
      return response
    })
    .catch(error => {
      console.log(error)
    })

  CONTEXT_API.getExchangeSwapInfo(context, toCurrencyCode, fromCurrencyCode)
    .then(response => {
      dispatch({ type: 'UPDATE_CRYPTO_REVERSE_EXCHANGE_INFO', data: response })
      return response
    })
    .catch(error => {
      console.log(error)
    })
}

export const getShapeShiftTokens = () => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  try {
    const response = await account.getExchangeCurrencies() // await fetch('https://shapeshift.io/getcoins',
    dispatch({ type: 'ON_AVAILABLE_SHAPE_SHIFT_TOKENS', data: response })
  } catch (error) {
    dispatch({ type: 'ON_AVAILABLE_SHAPE_SHIFT_TOKENS', data: [] })
  }
}

export const selectWalletForExchange = (walletId: string, currencyCode: string) => (dispatch: Dispatch, getState: GetState) => {
  // This is a hack .. if the currecy code is not supported then we cant do the exchange
  const state = getState()
  const availableShapeShiftTokens = state.cryptoExchange.availableShapeShiftTokens
  if (!availableShapeShiftTokens[currencyCode]) {
    setTimeout(() => {
      Alert.alert(s.strings.could_not_select, currencyCode + ' ' + s.strings.token_not_supported)
    }, 1)
    return
  }
  dispatch(getShapeShiftTokens())
  const wallet = state.ui.wallets.byId[walletId]
  switch (state.cryptoExchange.changeWallet) {
    case Constants.TO:
      dispatch(selectToFromWallet('SELECT_TO_WALLET_CRYPTO_EXCHANGE', wallet, currencyCode))
      break
    case Constants.FROM:
      dispatch(selectToFromWallet('SELECT_FROM_WALLET_CRYPTO_EXCHANGE', wallet, currencyCode))
      break
    default:
  }
}

export const exchangeTimerExpired = () => (dispatch: Dispatch, getState: GetState) => {
  Actions[Constants.EXCHANGE_QUOTE_PROCESSING_SCENE]()
  const state = getState()
  const hasFrom = state.cryptoExchange.fromWallet ? state.cryptoExchange.fromWallet : null
  const hasTo = state.cryptoExchange.toWallet ? state.cryptoExchange.toWallet : null
  const info = {
    whichWallet: Constants.FROM,
    primaryExchangeAmount: state.cryptoExchange.fromDisplayAmount,
    primaryNativeAmount: state.cryptoExchange.fromNativeAmount
  }
  if (hasFrom && hasTo) {
    dispatch(getShiftTransaction(hasFrom, hasTo, Constants.FROM, info))
  }
}
