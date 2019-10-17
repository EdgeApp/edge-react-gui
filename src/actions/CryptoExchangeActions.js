// @flow

import { bns } from 'biggystring'
import {
  type EdgeCurrencyWallet,
  type EdgeMetadata,
  type EdgeSpendInfo,
  type EdgeSwapQuote,
  type EdgeSwapRequest,
  type EdgeTransaction,
  errorNames
} from 'edge-core-js/types'
import React from 'react'
import { Alert } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { sprintf } from 'sprintf-js'

import { SwapVerifyShapeshiftModal } from '../components/modals/SwapVerifyShapeshiftModal.js'
import { Airship, showError } from '../components/services/AirshipInstance.js'
import * as Constants from '../constants/indexConstants'
import { intl } from '../locales/intl'
import s from '../locales/strings.js'
import * as CORE_SELECTORS from '../modules/Core/selectors'
import * as SETTINGS_SELECTORS from '../modules/Settings/selectors.js'
import * as UI_SELECTORS from '../modules/UI/selectors'
import type { Dispatch, GetState, State } from '../types/reduxTypes.js'
import type { GuiCurrencyInfo, GuiDenomination, GuiSwapInfo, GuiWallet } from '../types/types.js'
import { trackEvent } from '../util/tracking.js'
import * as UTILS from '../util/utils'
import { updateSwapCount } from './RequestReviewActions.js'

const DIVIDE_PRECISION = 18

export type SetNativeAmountInfo = {
  whichWallet: 'from' | 'to',
  primaryNativeAmount: string
}

export const getQuoteForTransaction = (info: SetNativeAmountInfo) => async (dispatch: Dispatch, getState: GetState) => {
  Actions[Constants.EXCHANGE_QUOTE_PROCESSING_SCENE]()

  try {
    const state = getState()
    const { fromWallet, toWallet, fromCurrencyCode, toCurrencyCode } = state.cryptoExchange
    if (fromWallet == null || toWallet == null) {
      throw new Error('No wallet selected') // Should never happen
    }
    if (fromCurrencyCode == null || toCurrencyCode == null) {
      throw new Error('No currency selected') // Should never happen
    }

    const fromCoreWallet: EdgeCurrencyWallet = CORE_SELECTORS.getWallet(state, fromWallet.id)
    const toCoreWallet: EdgeCurrencyWallet = CORE_SELECTORS.getWallet(state, toWallet.id)
    const request: EdgeSwapRequest = {
      fromCurrencyCode,
      fromWallet: fromCoreWallet,
      nativeAmount: info.primaryNativeAmount,
      quoteFor: info.whichWallet,
      toCurrencyCode,
      toWallet: toCoreWallet
    }

    const swapInfo = await fetchSwapQuote(state, request)
    Actions[Constants.EXCHANGE_QUOTE_SCENE]({ swapInfo })
    dispatch({ type: 'UPDATE_SWAP_QUOTE', data: swapInfo })
  } catch (error) {
    Actions.popTo(Constants.EXCHANGE_SCENE)
    dispatch(processSwapQuoteError(error))
  }
}

export const exchangeTimerExpired = (swapInfo: GuiSwapInfo) => async (dispatch: Dispatch, getState: GetState) => {
  if (Actions.currentScene !== Constants.EXCHANGE_QUOTE_SCENE) return
  Actions[Constants.EXCHANGE_QUOTE_PROCESSING_SCENE]()

  try {
    swapInfo = await fetchSwapQuote(getState(), swapInfo.request)
    Actions[Constants.EXCHANGE_QUOTE_SCENE]({ swapInfo })
    dispatch({ type: 'UPDATE_SWAP_QUOTE', data: swapInfo })
  } catch (error) {
    Actions.popTo(Constants.EXCHANGE_SCENE)
    dispatch(processSwapQuoteError(error))
  }
}

export const exchangeMax = () => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const fromWallet = state.cryptoExchange.fromWallet
  if (!fromWallet) {
    return
  }
  const wallet: EdgeCurrencyWallet = CORE_SELECTORS.getWallet(state, fromWallet.id)
  const currencyCode = state.cryptoExchange.fromCurrencyCode ? state.cryptoExchange.fromCurrencyCode : undefined
  const parentCurrencyCode = wallet.currencyInfo.currencyCode
  if (Constants.getSpecialCurrencyInfo(parentCurrencyCode).noMaxSpend) {
    const message = sprintf(s.strings.max_spend_unavailable_modal_message, wallet.currencyInfo.displayName)
    Alert.alert(s.strings.max_spend_unavailable_modal_title, message)
    return
  }
  const dummyPublicAddress = Constants.getSpecialCurrencyInfo(parentCurrencyCode).dummyPublicAddress
  dispatch({ type: 'START_CALC_MAX' })
  let primaryNativeAmount = '0'

  try {
    const publicAddress = dummyPublicAddress || (await wallet.getReceiveAddress()).publicAddress
    const edgeSpendInfo: EdgeSpendInfo = {
      networkFeeOption: 'standard',
      currencyCode,
      spendTargets: [{ publicAddress }]
    }
    primaryNativeAmount = await wallet.getMaxSpendable(edgeSpendInfo)
  } catch (error) {
    showError(error)
  }
  dispatch({ type: 'SET_FROM_WALLET_MAX', data: primaryNativeAmount })
}

async function fetchSwapQuote (state: State, request: EdgeSwapRequest): Promise<GuiSwapInfo> {
  const account = CORE_SELECTORS.getAccount(state)
  const quote: EdgeSwapQuote = await account.fetchSwapQuote(request)

  // Currency conversion tools:
  const { fromWallet, toWallet, fromCurrencyCode, toCurrencyCode } = request
  const currencyConverter = CORE_SELECTORS.getCurrencyConverter(state)

  // Format from amount:
  const fromPrimaryInfo = state.cryptoExchange.fromWalletPrimaryInfo
  const fromDisplayAmountTemp = bns.div(quote.fromNativeAmount, fromPrimaryInfo.displayDenomination.multiplier, DIVIDE_PRECISION)
  const fromDisplayAmount = bns.toFixed(fromDisplayAmountTemp, 0, 8)

  // Format from fiat:
  const fromExchangeDenomination = SETTINGS_SELECTORS.getExchangeDenomination(state, fromCurrencyCode)
  const fromBalanceInCryptoDisplay = UTILS.convertNativeToExchange(fromExchangeDenomination.multiplier)(quote.fromNativeAmount)
  const fromBalanceInFiatRaw = await currencyConverter.convertCurrency(fromCurrencyCode, fromWallet.fiatCurrencyCode, Number(fromBalanceInCryptoDisplay))
  const fromFiat = intl.formatNumber(fromBalanceInFiatRaw || 0, { toFixed: 2 })

  // Format fee:
  const settings = SETTINGS_SELECTORS.getSettings(state)
  const feeDenomination = SETTINGS_SELECTORS.getDisplayDenominationFromSettings(settings, quote.networkFee.currencyCode)
  const feeNativeAmount = quote.networkFee.nativeAmount
  const feeTempAmount = bns.div(feeNativeAmount, fromPrimaryInfo.displayDenomination.multiplier, DIVIDE_PRECISION)
  const feeDisplayAmount = bns.toFixed(feeTempAmount, 0, 8)
  const fee = feeDisplayAmount + ' ' + feeDenomination.name

  // Format to amount:
  const toPrimaryInfo = state.cryptoExchange.toWalletPrimaryInfo
  const toDisplayAmountTemp = bns.div(quote.toNativeAmount, toPrimaryInfo.displayDenomination.multiplier, DIVIDE_PRECISION)
  const toDisplayAmount = bns.toFixed(toDisplayAmountTemp, 0, 8)

  // Format to fiat:
  const toExchangeDenomination = SETTINGS_SELECTORS.getExchangeDenomination(state, toCurrencyCode)
  const toBalanceInCryptoDisplay = UTILS.convertNativeToExchange(toExchangeDenomination.multiplier)(quote.toNativeAmount)
  const toBalanceInFiatRaw = await currencyConverter.convertCurrency(toCurrencyCode, toWallet.fiatCurrencyCode, Number(toBalanceInCryptoDisplay))
  const toFiat = intl.formatNumber(toBalanceInFiatRaw || 0, { toFixed: 2 })

  const swapInfo: GuiSwapInfo = {
    quote,
    request,

    fee,
    fromDisplayAmount,
    fromFiat,
    toDisplayAmount,
    toFiat
  }
  return swapInfo
}

const processSwapQuoteError = (error: any) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { fromCurrencyCode, toCurrencyCode } = state.cryptoExchange

  // Basic sanity checks (should never fail):
  if (error == null) return
  if (fromCurrencyCode == null || toCurrencyCode == null) return

  // Check for known error types:
  switch (error.name) {
    case errorNames.InsufficientFundsError: {
      return dispatch({ type: 'RECEIVED_INSUFFICENT_FUNDS_ERROR' })
    }

    case errorNames.SwapAboveLimitError: {
      const settings = SETTINGS_SELECTORS.getSettings(state)
      const currentCurrencyDenomination = SETTINGS_SELECTORS.getDisplayDenominationFromSettings(settings, fromCurrencyCode)

      const nativeMax: string = error.nativeMax
      const displayDenomination = SETTINGS_SELECTORS.getDisplayDenomination(state, fromCurrencyCode)
      const nativeToDisplayRatio = displayDenomination.multiplier
      const displayMax = UTILS.convertNativeToDisplay(nativeToDisplayRatio)(nativeMax)

      return dispatch({
        type: 'GENERIC_SHAPE_SHIFT_ERROR',
        data: sprintf(s.strings.amount_above_limit, displayMax, currentCurrencyDenomination.name)
      })
    }

    case errorNames.SwapBelowLimitError: {
      const settings = SETTINGS_SELECTORS.getSettings(state)
      const currentCurrencyDenomination = SETTINGS_SELECTORS.getDisplayDenominationFromSettings(settings, fromCurrencyCode)

      const nativeMin: string = error.nativeMin
      const displayDenomination = SETTINGS_SELECTORS.getDisplayDenomination(state, fromCurrencyCode)
      const nativeToDisplayRatio = displayDenomination.multiplier
      const displayMin = UTILS.convertNativeToDisplay(nativeToDisplayRatio)(nativeMin)

      return dispatch({
        type: 'GENERIC_SHAPE_SHIFT_ERROR',
        data: sprintf(s.strings.amount_below_limit, displayMin, currentCurrencyDenomination.name)
      })
    }

    case errorNames.SwapCurrencyError: {
      return dispatch({
        type: 'GENERIC_SHAPE_SHIFT_ERROR',
        data: sprintf(s.strings.ss_unable, fromCurrencyCode, toCurrencyCode)
      })
    }

    case errorNames.SwapPermissionError: {
      switch (error.reason) {
        case 'geoRestriction': {
          return dispatch({
            type: 'GENERIC_SHAPE_SHIFT_ERROR',
            data: s.strings.ss_geolock
          })
        }

        case 'needsActivation': {
          if (error.pluginName === 'shapeshift') {
            Alert.alert(s.strings.kyc_title, s.strings.kyc_message, [
              { text: s.strings.string_cancel_cap, onPress: () => {} },
              { text: s.strings.string_ok, onPress: () => Actions[Constants.SWAP_ACTIVATE_SHAPESHIFT]() }
            ])
            return
          }
          break // Not handled
        }

        case 'noVerification': {
          if (error.pluginName === 'shapeshift') {
            Airship.show(bridge => <SwapVerifyShapeshiftModal bridge={bridge} />)
            return
          }
          break // Not handled
        }
      }
      break // Not handled
    }
  }

  // Some plugins get this error wrong:
  if (error.message === errorNames.InsufficientFundsError) {
    return dispatch({ type: 'RECEIVED_INSUFFICENT_FUNDS_ERROR' })
  }

  // Anything else:
  return dispatch({
    type: 'GENERIC_SHAPE_SHIFT_ERROR',
    data: error.message
  })
}

export const shiftCryptoCurrency = (swapInfo: GuiSwapInfo) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  dispatch({ type: 'START_SHIFT_TRANSACTION' })

  const { quote, request } = swapInfo
  const { fromWallet, toWallet } = request

  try {
    trackEvent('Exchange_Shift_Start')
    const broadcastedTransaction: EdgeTransaction = await quote.approve()
    await fromWallet.saveTx(broadcastedTransaction)

    const category = sprintf(
      'exchange:%s %s %s',
      state.cryptoExchange.fromCurrencyCode,
      s.strings.word_to_in_convert_from_to_string,
      state.cryptoExchange.toCurrencyCode
    )
    const account = CORE_SELECTORS.getAccount(state)
    const pn = quote.pluginName
    const si = account.swapConfig[pn].swapInfo
    const name = si.displayName
    const supportEmail = si.supportEmail
    const quoteIdUri = si.quoteUri && quote.quoteId ? si.quoteUri + quote.quoteId : broadcastedTransaction.txid
    const payinAddress = broadcastedTransaction.otherParams != null ? broadcastedTransaction.otherParams.payinAddress : ''
    const uniqueIdentifier = broadcastedTransaction.otherParams != null ? broadcastedTransaction.otherParams.uniqueIdentifier : ''
    const isEstimate = quote.isEstimate ? s.strings.estimated_quote : s.strings.fixed_quote
    const notes =
      sprintf(
        s.strings.exchange_notes_metadata_generic2,
        state.cryptoExchange.fromDisplayAmount,
        state.cryptoExchange.fromWalletPrimaryInfo.displayDenomination.name,
        fromWallet.name,
        state.cryptoExchange.toDisplayAmount,
        state.cryptoExchange.toWalletPrimaryInfo.displayDenomination.name,
        toWallet.name,
        quote.destinationAddress,
        quoteIdUri,
        payinAddress,
        uniqueIdentifier,
        supportEmail
      ) +
      ' ' +
      isEstimate

    const edgeMetaData: EdgeMetadata = {
      name,
      category,
      notes
    }
    Actions.popTo(Constants.EXCHANGE_SCENE)
    await fromWallet.saveTxMetadata(broadcastedTransaction.txid, broadcastedTransaction.currencyCode, edgeMetaData)

    dispatch({ type: 'SHIFT_COMPLETE' })

    updateSwapCount(state)

    setTimeout(() => {
      Alert.alert(s.strings.exchange_succeeded, s.strings.exchanges_may_take_minutes)
    }, 1)
    trackEvent('Exchange_Shift_Success')
  } catch (error) {
    console.log(error)
    trackEvent('Exchange_Shift_Failed')
    dispatch({ type: 'DONE_SHIFT_TRANSACTION' })
    setTimeout(() => {
      Alert.alert(s.strings.exchange_failed, error.message)
    }, 1)
  }
}

export const selectWalletForExchange = (walletId: string, currencyCode: string, direction?: string) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const wallet = state.ui.wallets.byId[walletId]
  const cc = currencyCode || wallet.currencyCode

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
    balanceMessage: await getBalanceMessage(state, wallet, cc),
    currencyCode: cc,
    primaryInfo
  }

  let walletDirection = 'from'
  if (direction) {
    // if optional parameter set in function call
    walletDirection = direction
  } else {
    // otherwise check state of exchange scene to decide
    walletDirection = state.cryptoExchange.changeWallet === 'from' ? 'from' : 'to'
  }

  if (walletDirection === 'from') {
    dispatch({ type: 'SELECT_FROM_WALLET_CRYPTO_EXCHANGE', data })
  } else {
    dispatch({ type: 'SELECT_TO_WALLET_CRYPTO_EXCHANGE', data })
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

async function getBalanceMessage (state: State, wallet: GuiWallet, currencyCode: string) {
  const currencyConverter = CORE_SELECTORS.getCurrencyConverter(state)
  const balanceInCrypto = wallet.nativeBalances[currencyCode]
  const isoFiatCurrencyCode = wallet.isoFiatCurrencyCode
  const exchangeDenomination = SETTINGS_SELECTORS.getExchangeDenomination(state, currencyCode)
  const balanceInCryptoDisplay = UTILS.convertNativeToExchange(exchangeDenomination.multiplier)(balanceInCrypto)
  const balanceInFiat = await currencyConverter.convertCurrency(currencyCode, isoFiatCurrencyCode, Number(balanceInCryptoDisplay))

  const displayDenomination = SETTINGS_SELECTORS.getDisplayDenomination(state, currencyCode)

  const cryptoBalanceAmount: string = UTILS.convertNativeToDisplay(displayDenomination.multiplier)(balanceInCrypto) // convert to correct denomination
  const cryptoBalanceAmountString = cryptoBalanceAmount ? intl.formatNumber(UTILS.decimalOrZero(bns.toFixed(cryptoBalanceAmount, 0, 6), 6)) : '0' // limit decimals and check if infitesimal, also cut off trailing zeroes (to right of significant figures)
  const balanceInFiatString = intl.formatNumber(balanceInFiat || 0, { toFixed: 2 })

  const fiatCurrencyCode = UTILS.getDenomFromIsoCode(wallet.fiatCurrencyCode)
  const fiatDisplayCode = fiatCurrencyCode.symbol

  if (fiatDisplayCode == null) return ''

  return 'Balance: ' + cryptoBalanceAmountString + ' ' + displayDenomination.name + ' (' + fiatDisplayCode + ' ' + balanceInFiatString + ')'
}
