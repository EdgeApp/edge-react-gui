// @flow
import { bns } from 'biggystring'
import type { EdgeCurrencyWallet, EdgeExchangeQuote, EdgeExchangeQuoteOptions, EdgeMetadata, EdgeSpendInfo, EdgeSwapQuote } from 'edge-core-js'
import { errorNames } from 'edge-core-js'
import { Alert } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { sprintf } from 'sprintf-js'

import * as Constants from '../constants/indexConstants'
import { intl } from '../locales/intl'
import s from '../locales/strings.js'
import * as CORE_SELECTORS from '../modules/Core/selectors'
import * as WALLET_API from '../modules/Core/Wallets/api.js'
import type { Dispatch, GetState } from '../modules/ReduxTypes'
import * as SETTINGS_SELECTORS from '../modules/Settings/selectors.js'
import * as UI_SELECTORS from '../modules/UI/selectors'
import type { GuiCurrencyInfo, GuiDenomination, GuiWallet } from '../types'
import * as UTILS from '../util/utils'

// import { getExchangeDenomination as settingsGetExchangeDenomination } from '../../modules/UI/Settings/selectors.js'

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
    quoteExpireDate: Date | null
  }
) {
  return {
    type,
    data
  }
}

export const setKycToken = (tokenInfo: { access_token: string, refresh_token: string }, pluginName: string) => async (
  dispatch: Dispatch,
  getState: GetState
) => {
  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  await account.swapConfig[pluginName].changeUserSettings({ accessToken: tokenInfo.access_token, refreshToken: tokenInfo.refresh_token })
  dispatch({ type: 'ON_KYC_TOKEN_SET' })
}

export const getQuoteForTransaction = (info: SetNativeAmountInfo) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const fromWallet: GuiWallet | null = state.cryptoExchange.fromWallet
  const toWallet: GuiWallet | null = state.cryptoExchange.toWallet

  // dispatch(actions.setNativeAmount(info, false))
  Actions[Constants.EXCHANGE_QUOTE_PROCESSING_SCENE]()
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
        'exchange:%s %s %s',
        state.cryptoExchange.fromCurrencyCode,
        s.strings.word_to_in_convert_from_to_string,
        state.cryptoExchange.toCurrencyCode
      )

      let name = ''
      let supportEmail = ''
      let orderId = ''
      if (quote) {
        switch (quote.pluginName) {
          case 'shapeshift':
            name = 'ShapeShift'
            supportEmail = 'support@shapeshift.io'
            orderId = quote.quoteUri
            break
          case 'changelly':
            name = 'Changelly'
            supportEmail = 'support@changelly.com'
            break
        }
      }
      if (!orderId) {
        orderId = broadcastedTransaction.txid
      }

      const notes = sprintf(
        s.strings.exchange_notes_metadata_generic,
        state.cryptoExchange.fromDisplayAmount,
        state.cryptoExchange.fromWalletPrimaryInfo.displayDenomination.name,
        fromWallet.name,
        state.cryptoExchange.toDisplayAmount,
        state.cryptoExchange.toWalletPrimaryInfo.displayDenomination.name,
        toWallet.name,
        orderId,
        supportEmail
      )

      const edgeMetaData: EdgeMetadata = {
        name,
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
  const fromCurrencyCode = state.cryptoExchange.fromCurrencyCode ? state.cryptoExchange.fromCurrencyCode : undefined
  const toCurrencyCode = state.cryptoExchange.toCurrencyCode ? state.cryptoExchange.toCurrencyCode : undefined

  if (!fromCurrencyCode || !toCurrencyCode) {
    // this funciton is solely for flow
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

  let quoteError
  let edgeCoinExchangeQuote: EdgeSwapQuote
  const settings = SETTINGS_SELECTORS.getSettings(state)
  try {
    edgeCoinExchangeQuote = await account.fetchSwapQuote(quoteData)
  } catch (error) {
    if (error.message === 'InsufficientFundsError') {
      dispatch(processMakeSpendError(error))
      return
    }
    if (error.message === 'No swap providers enabled') {
      dispatch({ type: 'NEED_KYC' })
      dispatch(processMakeSpendError(error))
      return
    }
    if (error.name === errorNames.SwapAboveLimitError) {
      const nativeMax: string = error.nativeMax

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
    if (error.name === errorNames.SwapBelowLimitError) {
      const nativeMin: string = error.nativeMin

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
    if (error.name === errorNames.SwapPermissionError) {
      if (error.message === 'needsActivation') {
        dispatch({ type: 'NEED_KYC' })
        Actions.popTo(Constants.EXCHANGE_SCENE)
        return
      }
      if (error.message === 'geoRestriction') {
        dispatch(processMakeSpendError(error))
        return
      }
      if (error.message === 'noVerification') {
        dispatch({ type: 'GENERIC_SHAPE_SHIFT_ERROR', data: s.strings.kyc_ss_finish })
        Actions.popTo(Constants.EXCHANGE_SCENE)
        return
      }
    }
    if (error.name === errorNames.SwapCurrencyError) {
      dispatch({ type: 'GENERIC_SHAPE_SHIFT_ERROR', data: error.message })
      Actions.popTo(Constants.EXCHANGE_SCENE)
      return
    }
    // console.log('Got the error ', error.name)
    quoteError = error
  }

  if (quoteError || !edgeCoinExchangeQuote) {
    console.log('stop')
    throw quoteError
  }

  const fromPrimaryInfo = state.cryptoExchange.fromWalletPrimaryInfo
  const toPrimaryInfo = state.cryptoExchange.toWalletPrimaryInfo

  const currentFromCurrencyDenomination = SETTINGS_SELECTORS.getDisplayDenominationFromSettings(settings, fromCurrencyCode)
  const currentToCurrencyDenomination = SETTINGS_SELECTORS.getDisplayDenominationFromSettings(settings, toCurrencyCode)
  const feeDenomination = SETTINGS_SELECTORS.getDisplayDenominationFromSettings(settings, edgeCoinExchangeQuote.networkFee.currencyCode)

  const fromDisplayAmountTemp = bns.div(edgeCoinExchangeQuote.fromNativeAmount, fromPrimaryInfo.displayDenomination.multiplier, DIVIDE_PRECISION)
  const fromDisplayAmount = bns.toFixed(fromDisplayAmountTemp, 0, 8)
  const toDisplayAmountTemp = bns.div(edgeCoinExchangeQuote.toNativeAmount, toPrimaryInfo.displayDenomination.multiplier, DIVIDE_PRECISION)
  const toDisplayAmount = bns.toFixed(toDisplayAmountTemp, 0, 8)
  const feeNativeAmount = edgeCoinExchangeQuote.networkFee.nativeAmount
  const feeTempAmount = bns.div(feeNativeAmount, fromPrimaryInfo.displayDenomination.multiplier, DIVIDE_PRECISION)
  const feeDisplayAmouhnt = bns.toFixed(feeTempAmount, 0, 8)
  const fee = feeDisplayAmouhnt + ' ' + feeDenomination.name

  const currencyConverter = CORE_SELECTORS.getCurrencyConverter(state)
  const fromExchangeDenomination = SETTINGS_SELECTORS.getExchangeDenomination(state, fromWallet.currencyCode)
  const fromBalanceInCryptoDisplay = UTILS.convertNativeToExchange(fromExchangeDenomination.multiplier)(edgeCoinExchangeQuote.fromNativeAmount)
  const fromBalanceInFiatRaw = currencyConverter.convertCurrency(fromCurrencyCode, fromWallet.isoFiatCurrencyCode, Number(fromBalanceInCryptoDisplay))
  const fromBalanceInFiat = intl.formatNumber(fromBalanceInFiatRaw || 0, { toFixed: 2 })

  const toExchangeDenomination = SETTINGS_SELECTORS.getExchangeDenomination(state, toWallet.currencyCode)
  const toBalanceInCryptoDisplay = UTILS.convertNativeToExchange(toExchangeDenomination.multiplier)(edgeCoinExchangeQuote.toNativeAmount)
  const toBalanceInFiatRaw = currencyConverter.convertCurrency(toCurrencyCode, toWallet.isoFiatCurrencyCode, Number(toBalanceInCryptoDisplay))
  const toBalanceInFiat = intl.formatNumber(toBalanceInFiatRaw || 0, { toFixed: 2 })

  const returnObject = {
    quote: edgeCoinExchangeQuote,
    fromNativeAmount: edgeCoinExchangeQuote.fromNativeAmount,
    fromDisplayAmount: fromDisplayAmount,
    fromWalletName: fromWallet.name,
    fromWalletCurrencyName: fromWallet.currencyNames[fromCurrencyCode],
    fromFiat: fromBalanceInFiat,
    toNativeAmount: edgeCoinExchangeQuote.toNativeAmount,
    toDisplayAmount: toDisplayAmount,
    toWalletName: toWallet.name,
    toWalletCurrencyName: toWallet.currencyNames[toCurrencyCode],
    toFiat: toBalanceInFiat,
    quoteExpireDate: edgeCoinExchangeQuote.expirationDate || null,
    fee,
    fromCurrencyCode: currentFromCurrencyDenomination.name,
    toCurrencyCode: currentToCurrencyDenomination.name
  }
  Actions[Constants.EXCHANGE_QUOTE_SCENE]({ quote: returnObject })
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

  if (type === 'SELECT_FROM_WALLET_CRYPTO_EXCHANGE') {
    dispatch({ type: 'SELECT_FROM_WALLET_CRYPTO_EXCHANGE', data })
  } else {
    dispatch({ type: 'SELECT_TO_WALLET_CRYPTO_EXCHANGE', data })
  }
}

export const selectWalletForExchange = (walletId: string, currencyCode: string) => (dispatch: Dispatch, getState: GetState) => {
  // This is a hack .. if the currecy code is not supported then we cant do the exchange
  const state = getState()
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
  const currentScene = Actions.currentScene
  if (currentScene !== Constants.EXCHANGE_QUOTE_SCENE) {
    return
  }
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

export const checkEnabledExchanges = () => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  // make sure exchanges are enabled
  let isAnyExchangeEnabled = false
  const exchanges = account.swapConfig
  for (const exchange in exchanges) {
    if (exchanges[exchange].enabled === true) {
      isAnyExchangeEnabled = true
    }
  }

  if (!isAnyExchangeEnabled) {
    Alert.alert(s.strings.no_exchanges_available, s.strings.check_exchange_settings)
  }
}
