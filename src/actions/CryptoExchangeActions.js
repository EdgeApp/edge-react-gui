// @flow

import { bns } from 'biggystring'
import {
  type EdgeCurrencyWallet,
  type EdgeMetadata,
  type EdgeSpendInfo,
  type EdgeSwapQuote,
  type EdgeSwapRequest,
  type EdgeSwapResult,
  asMaybeInsufficientFundsError,
  asMaybeSwapAboveLimitError,
  asMaybeSwapBelowLimitError,
  asMaybeSwapCurrencyError,
  asMaybeSwapPermissionError
} from 'edge-core-js'
import * as React from 'react'
import { Alert } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { sprintf } from 'sprintf-js'

import { trackConversion } from '../actions/TrackingActions.js'
import { ButtonsModal } from '../components/modals/ButtonsModal.js'
import { Airship, showError } from '../components/services/AirshipInstance.js'
import { EXCHANGE_QUOTE_PROCESSING_SCENE, EXCHANGE_QUOTE_SCENE, EXCHANGE_SCENE, EXCHANGE_SUCCESS_SCENE, PLUGIN_BUY } from '../constants/SceneKeys.js'
import { getSpecialCurrencyInfo } from '../constants/WalletAndCurrencyConstants.js'
import { formatNumber } from '../locales/intl.js'
import s from '../locales/strings.js'
import {
  getDisplayDenomination,
  getDisplayDenominationFromSettings,
  getExchangeDenomination,
  getPrimaryExchangeDenomination
} from '../selectors/DenominationSelectors.js'
import { type Dispatch, type GetState, type RootState } from '../types/reduxTypes.js'
import type { GuiCurrencyInfo, GuiDenomination, GuiSwapInfo, GuiWallet } from '../types/types.js'
import { bestOfPlugins } from '../util/ReferralHelpers.js'
import { logEvent } from '../util/tracking.js'
import * as UTILS from '../util/utils'
import { updateSwapCount } from './RequestReviewActions.js'

const DIVIDE_PRECISION = 18

export type SetNativeAmountInfo = {
  whichWallet: 'from' | 'to',
  primaryNativeAmount: string
}

export const getQuoteForTransaction = (info: SetNativeAmountInfo) => async (dispatch: Dispatch, getState: GetState) => {
  Actions[EXCHANGE_QUOTE_PROCESSING_SCENE]()

  const state = getState()
  const { fromWallet, toWallet, fromCurrencyCode, toCurrencyCode } = state.cryptoExchange
  try {
    if (fromWallet == null || toWallet == null) {
      throw new Error('No wallet selected') // Should never happen
    }
    if (fromCurrencyCode == null || toCurrencyCode == null) {
      throw new Error('No currency selected') // Should never happen
    }

    const { currencyWallets } = state.core.account
    const fromCoreWallet: EdgeCurrencyWallet = currencyWallets[fromWallet.id]
    const toCoreWallet: EdgeCurrencyWallet = currencyWallets[toWallet.id]
    const request: EdgeSwapRequest = {
      fromCurrencyCode,
      fromWallet: fromCoreWallet,
      nativeAmount: info.primaryNativeAmount,
      quoteFor: info.whichWallet,
      toCurrencyCode,
      toWallet: toCoreWallet
    }

    const swapInfo = await fetchSwapQuote(state, request)

    Actions[EXCHANGE_QUOTE_SCENE]({
      swapInfo
    })
    dispatch({ type: 'UPDATE_SWAP_QUOTE', data: swapInfo })
  } catch (error) {
    Actions.popTo(EXCHANGE_SCENE)
    const insufficientFunds = asMaybeInsufficientFundsError(error)
    if (insufficientFunds != null && insufficientFunds.currencyCode != null && fromCurrencyCode !== insufficientFunds.currencyCode) {
      const { currencyCode, networkFee = '' } = insufficientFunds
      const multiplier = getExchangeDenomination(state, currencyCode).multiplier
      const amountString = UTILS.roundedFee(networkFee, 2, multiplier)
      const result = await Airship.show(bridge => (
        <ButtonsModal
          bridge={bridge}
          title={s.strings.buy_crypto_modal_title}
          message={`${amountString}${sprintf(s.strings.buy_parent_crypto_modal_message, currencyCode)}`}
          buttons={{
            buy: { label: sprintf(s.strings.buy_crypto_modal_buy_action, currencyCode) },
            exchange: { label: s.strings.buy_crypto_modal_exchange },
            cancel: { label: s.strings.buy_crypto_decline, type: 'secondary' }
          }}
        />
      ))
      switch (result) {
        case 'buy':
          Actions.jump(PLUGIN_BUY)
          return
        case 'exchange':
          dispatch({ type: 'SHIFT_COMPLETE' })
          if (fromWallet != null) {
            dispatch(selectWalletForExchange(fromWallet.id, currencyCode, 'to'))
          }
          break
      }
    }
    dispatch(processSwapQuoteError(error))
  }
}

export const exchangeTimerExpired = (swapInfo: GuiSwapInfo) => async (dispatch: Dispatch, getState: GetState) => {
  if (Actions.currentScene !== EXCHANGE_QUOTE_SCENE) return
  Actions[EXCHANGE_QUOTE_PROCESSING_SCENE]()

  try {
    swapInfo = await fetchSwapQuote(getState(), swapInfo.request)
    Actions[EXCHANGE_QUOTE_SCENE]({
      swapInfo
    })
    dispatch({ type: 'UPDATE_SWAP_QUOTE', data: swapInfo })
  } catch (error) {
    Actions.popTo(EXCHANGE_SCENE)
    dispatch(processSwapQuoteError(error))
  }
}

export const exchangeMax = () => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const fromWallet = state.cryptoExchange.fromWallet
  if (!fromWallet) {
    return
  }
  const { currencyWallets } = state.core.account
  const wallet: EdgeCurrencyWallet = currencyWallets[fromWallet.id]
  const currencyCode = state.cryptoExchange.fromCurrencyCode ? state.cryptoExchange.fromCurrencyCode : undefined
  const parentCurrencyCode = wallet.currencyInfo.currencyCode
  if (getSpecialCurrencyInfo(parentCurrencyCode).noMaxSpend) {
    const message = sprintf(s.strings.max_spend_unavailable_modal_message, wallet.currencyInfo.displayName)
    Alert.alert(s.strings.max_spend_unavailable_modal_title, message)
    return
  }
  const dummyPublicAddress = getSpecialCurrencyInfo(parentCurrencyCode).dummyPublicAddress
  dispatch({ type: 'START_CALC_MAX' })
  let primaryNativeAmount = '0'

  try {
    const publicAddress = dummyPublicAddress || (await wallet.getReceiveAddress()).publicAddress
    const edgeSpendInfo: EdgeSpendInfo = {
      networkFeeOption: 'standard',
      currencyCode,
      spendTargets: [{ publicAddress }]
    }
    if (currencyCode === 'BTC') {
      edgeSpendInfo.networkFeeOption = 'high'
    }
    primaryNativeAmount = await wallet.getMaxSpendable(edgeSpendInfo)
  } catch (error) {
    showError(error)
  }
  dispatch({ type: 'SET_FROM_WALLET_MAX', data: primaryNativeAmount })
}

async function fetchSwapQuote(state: RootState, request: EdgeSwapRequest): Promise<GuiSwapInfo> {
  const { account } = state.core

  // Find preferred swap provider:
  const activePlugins = bestOfPlugins(state.account.referralCache.accountPlugins, state.account.accountReferral, state.ui.settings.preferredSwapPluginId)
  const preferPluginId = activePlugins.preferredSwapPluginId
  if (preferPluginId != null) {
    const { swapSource } = activePlugins
    const reason = swapSource.type === 'promotion' ? 'promo ' + swapSource.installerId : swapSource.type
    console.log(`Preferring ${preferPluginId} from ${reason}`)
  }

  // Get the quote:
  const quote: EdgeSwapQuote = await account.fetchSwapQuote(request, {
    preferPluginId,
    disabled: activePlugins.disabled,
    promoCodes: activePlugins.promoCodes
  })

  // Currency conversion tools:
  const { fromWallet, toWallet, fromCurrencyCode, toCurrencyCode } = request
  const currencyConverter = account.rateCache

  // Format from amount:
  const fromPrimaryInfo = state.cryptoExchange.fromWalletPrimaryInfo
  const fromDisplayAmountTemp = bns.div(quote.fromNativeAmount, fromPrimaryInfo.displayDenomination.multiplier, DIVIDE_PRECISION)
  const fromDisplayAmount = bns.toFixed(fromDisplayAmountTemp, 0, 8)

  // Format from fiat:
  const fromExchangeDenomination = getExchangeDenomination(state, fromCurrencyCode)
  const fromBalanceInCryptoDisplay = UTILS.convertNativeToExchange(fromExchangeDenomination.multiplier)(quote.fromNativeAmount)
  const fromBalanceInFiatRaw = await currencyConverter.convertCurrency(fromCurrencyCode, fromWallet.fiatCurrencyCode, Number(fromBalanceInCryptoDisplay))
  const fromFiat = formatNumber(fromBalanceInFiatRaw || 0, { toFixed: 2 })

  // Format crypto fee:
  const { settings } = state.ui
  const feeDenomination = getDisplayDenominationFromSettings(settings, request.fromWallet.currencyInfo.currencyCode)
  const feeNativeAmount = quote.networkFee.nativeAmount
  const feeTempAmount = bns.div(feeNativeAmount, feeDenomination.multiplier, DIVIDE_PRECISION)
  const feeDisplayAmount = bns.toFixed(feeTempAmount, 0, 6)

  // Format fiat fee:
  const feeDenominatedAmount = await fromWallet.nativeToDenomination(feeNativeAmount, request.fromWallet.currencyInfo.currencyCode)
  const feeFiatAmountRaw = await currencyConverter.convertCurrency(
    request.fromWallet.currencyInfo.currencyCode,
    fromWallet.fiatCurrencyCode,
    Number(feeDenominatedAmount)
  )
  const feeFiatAmount = formatNumber(feeFiatAmountRaw || 0, { toFixed: 2 })
  const fee = `${feeDisplayAmount} ${feeDenomination.name} (${feeFiatAmount} ${fromWallet.fiatCurrencyCode.replace('iso:', '')})`
  const fromTotalFiat = formatNumber(bns.add(fromBalanceInFiatRaw.toFixed(18), feeFiatAmountRaw.toFixed(18)), { toFixed: 2 })

  // Format to amount:
  const toPrimaryInfo = state.cryptoExchange.toWalletPrimaryInfo
  const toDisplayAmountTemp = bns.div(quote.toNativeAmount, toPrimaryInfo.displayDenomination.multiplier, DIVIDE_PRECISION)
  const toDisplayAmount = bns.toFixed(toDisplayAmountTemp, 0, 8)

  // Format to fiat:
  const toExchangeDenomination = getExchangeDenomination(state, toCurrencyCode)
  const toBalanceInCryptoDisplay = UTILS.convertNativeToExchange(toExchangeDenomination.multiplier)(quote.toNativeAmount)
  const toBalanceInFiatRaw = await currencyConverter.convertCurrency(toCurrencyCode, toWallet.fiatCurrencyCode, Number(toBalanceInCryptoDisplay))
  const toFiat = formatNumber(toBalanceInFiatRaw || 0, { toFixed: 2 })

  const swapInfo: GuiSwapInfo = {
    quote,
    request,

    fee,
    fromDisplayAmount,
    fromFiat,
    fromTotalFiat,
    toDisplayAmount,
    toFiat
  }
  return swapInfo
}

const processSwapQuoteError = (error: mixed) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { fromCurrencyCode, toCurrencyCode } = state.cryptoExchange

  // Basic sanity checks (should never fail):
  if (error == null) return
  if (fromCurrencyCode == null || toCurrencyCode == null) return

  // Check for known error types:
  const insufficientFunds = asMaybeInsufficientFundsError(error)
  if (insufficientFunds != null) {
    return dispatch({ type: 'RECEIVED_INSUFFICIENT_FUNDS_ERROR' })
  }

  const aboveLimit = asMaybeSwapAboveLimitError(error)
  if (aboveLimit != null) {
    const { settings } = state.ui
    const currentCurrencyDenomination = getDisplayDenominationFromSettings(settings, fromCurrencyCode)

    const { nativeMax } = aboveLimit
    const displayDenomination = getDisplayDenomination(state, fromCurrencyCode)
    const nativeToDisplayRatio = displayDenomination.multiplier
    const displayMax = UTILS.convertNativeToDisplay(nativeToDisplayRatio)(nativeMax)

    return dispatch({
      type: 'GENERIC_SHAPE_SHIFT_ERROR',
      data: sprintf(s.strings.amount_above_limit, displayMax, currentCurrencyDenomination.name)
    })
  }

  const belowLimit = asMaybeSwapBelowLimitError(error)
  if (belowLimit) {
    const { settings } = state.ui
    const currentCurrencyDenomination = getDisplayDenominationFromSettings(settings, fromCurrencyCode)

    const { nativeMin } = belowLimit
    const displayDenomination = getDisplayDenomination(state, fromCurrencyCode)
    const nativeToDisplayRatio = displayDenomination.multiplier
    const displayMin = UTILS.convertNativeToDisplay(nativeToDisplayRatio)(nativeMin)

    return dispatch({
      type: 'GENERIC_SHAPE_SHIFT_ERROR',
      data: sprintf(s.strings.amount_below_limit, displayMin, currentCurrencyDenomination.name)
    })
  }

  const currencyError = asMaybeSwapCurrencyError(error)
  if (currencyError != null) {
    return dispatch({
      type: 'GENERIC_SHAPE_SHIFT_ERROR',
      data: sprintf(s.strings.ss_unable, fromCurrencyCode, toCurrencyCode)
    })
  }

  const permissionError = asMaybeSwapPermissionError(error)
  if (permissionError != null) {
    switch (permissionError.reason) {
      case 'geoRestriction': {
        return dispatch({
          type: 'GENERIC_SHAPE_SHIFT_ERROR',
          data: s.strings.ss_geolock
        })
      }
    }
  }

  // Some plugins get this error wrong:
  if (error.message === 'InsufficientFundsError') {
    return dispatch({ type: 'RECEIVED_INSUFFICIENT_FUNDS_ERROR' })
  }

  // Anything else:
  const typeHack: any = error
  return dispatch({
    type: 'GENERIC_SHAPE_SHIFT_ERROR',
    data: typeHack.message
  })
}

export const shiftCryptoCurrency = (swapInfo: GuiSwapInfo) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { account } = state.core
  dispatch({ type: 'START_SHIFT_TRANSACTION' })

  const { quote, request } = swapInfo
  const { pluginId, toNativeAmount } = quote
  const { fromWallet, toWallet, fromCurrencyCode, toCurrencyCode } = request

  try {
    logEvent('SwapStart')
    const result: EdgeSwapResult = await quote.approve()
    await fromWallet.saveTx(result.transaction)

    const si = account.swapConfig[pluginId].swapInfo

    let category: string
    let name: string
    if (pluginId === 'transfer') {
      category = sprintf('transfer:%s %s %s', fromCurrencyCode, s.strings.word_to_in_convert_from_to_string, toWallet.name)
      name = toWallet.name || ''
    } else {
      category = sprintf('exchange:%s %s %s', fromCurrencyCode, s.strings.word_to_in_convert_from_to_string, toCurrencyCode)
      name = si.displayName
    }

    const edgeMetaData: EdgeMetadata = {
      name,
      category
    }
    Actions[EXCHANGE_SUCCESS_SCENE]()
    await fromWallet.saveTxMetadata(result.transaction.txid, result.transaction.currencyCode, edgeMetaData)

    dispatch({ type: 'SHIFT_COMPLETE' })

    updateSwapCount(state)

    const exchangeAmount = await toWallet.nativeToDenomination(toNativeAmount, toCurrencyCode)
    const trackConversionOpts: { [key: string]: any } = {
      account,
      pluginId,
      currencyCode: toCurrencyCode,
      exchangeAmount: Number(exchangeAmount)
    }
    if (result.orderId != null) {
      trackConversionOpts.orderId = result.orderId
    }
    dispatch(trackConversion('SwapSuccess', trackConversionOpts))
  } catch (error) {
    console.log(error)
    logEvent('SwapFailed')
    dispatch({ type: 'DONE_SHIFT_TRANSACTION' })
    setTimeout(() => {
      showError(`${s.strings.exchange_failed}. ${error.message}`)
    }, 1)
  }
}

export const selectWalletForExchange = (walletId: string, currencyCode: string, direction: 'from' | 'to') => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const wallet = state.ui.wallets.byId[walletId]
  const cc = currencyCode || wallet.currencyCode

  const primaryDisplayDenomination: GuiDenomination = getDisplayDenomination(state, cc)
  const primaryExchangeDenomination: GuiDenomination = getPrimaryExchangeDenomination(state, cc, wallet)
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

  if (direction === 'from') {
    dispatch({ type: 'SELECT_FROM_WALLET_CRYPTO_EXCHANGE', data })
  } else {
    dispatch({ type: 'SELECT_TO_WALLET_CRYPTO_EXCHANGE', data })
  }
}

export const checkEnabledExchanges = () => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { account } = state.core
  // make sure exchanges are enabled
  let isAnyExchangeEnabled = false
  const exchanges = account.swapConfig
  for (const exchange of Object.keys(exchanges)) {
    if (exchanges[exchange].enabled === true) {
      isAnyExchangeEnabled = true
    }
  }

  if (!isAnyExchangeEnabled) {
    Alert.alert(s.strings.no_exchanges_available, s.strings.check_exchange_settings)
  }
}

async function getBalanceMessage(state: RootState, wallet: GuiWallet, currencyCode: string) {
  const { account } = state.core
  const currencyConverter = account.rateCache
  const balanceInCrypto = wallet.nativeBalances[currencyCode]
  const isoFiatCurrencyCode = wallet.isoFiatCurrencyCode
  const exchangeDenomination = getExchangeDenomination(state, currencyCode)
  const balanceInCryptoDisplay = UTILS.convertNativeToExchange(exchangeDenomination.multiplier)(balanceInCrypto)
  const balanceInFiat = await currencyConverter.convertCurrency(currencyCode, isoFiatCurrencyCode, Number(balanceInCryptoDisplay))

  const displayDenomination = getDisplayDenomination(state, currencyCode)

  const cryptoBalanceAmount: string = UTILS.convertNativeToDisplay(displayDenomination.multiplier)(balanceInCrypto) // convert to correct denomination
  const cryptoBalanceAmountString = cryptoBalanceAmount ? formatNumber(UTILS.decimalOrZero(bns.toFixed(cryptoBalanceAmount, 0, 6), 6)) : '0' // limit decimals and check if infitesimal, also cut off trailing zeroes (to right of significant figures)
  const balanceInFiatString = formatNumber(balanceInFiat || 0, { toFixed: 2 })

  const fiatCurrencyCode = UTILS.getDenomFromIsoCode(wallet.fiatCurrencyCode)
  const fiatDisplayCode = fiatCurrencyCode.symbol

  if (fiatDisplayCode == null) return ''

  return 'Balance: ' + cryptoBalanceAmountString + ' ' + displayDenomination.name + ' (' + fiatDisplayCode + ' ' + balanceInFiatString + ')'
}
