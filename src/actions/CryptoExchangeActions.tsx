import { add, div, toFixed } from 'biggystring'
import {
  asMaybeInsufficientFundsError,
  asMaybeSwapAboveLimitError,
  asMaybeSwapBelowLimitError,
  asMaybeSwapCurrencyError,
  asMaybeSwapPermissionError,
  EdgeCurrencyWallet,
  EdgeSpendInfo,
  EdgeSwapQuote,
  EdgeSwapRequest,
  EdgeSwapResult
} from 'edge-core-js'
import * as React from 'react'
import { Alert } from 'react-native'
import { sprintf } from 'sprintf-js'

import { trackConversion } from '../actions/TrackingActions'
import { ButtonsModal } from '../components/modals/ButtonsModal'
import { Airship, showError } from '../components/services/AirshipInstance'
import { getSpecialCurrencyInfo } from '../constants/WalletAndCurrencyConstants'
import { formatNumber } from '../locales/intl'
import s from '../locales/strings'
import { getDisplayDenomination, getExchangeDenomination } from '../selectors/DenominationSelectors'
import { convertCurrency } from '../selectors/WalletSelectors'
import { RootState, ThunkAction } from '../types/reduxTypes'
import { Actions } from '../types/routerTypes'
import { GuiCurrencyInfo, GuiDenomination, GuiSwapInfo } from '../types/types'
import { getWalletName } from '../util/CurrencyWalletHelpers'
import { logActivity } from '../util/logger'
import { bestOfPlugins } from '../util/ReferralHelpers'
import { logEvent } from '../util/tracking'
import { convertNativeToDisplay, convertNativeToExchange, DECIMAL_PRECISION, decimalOrZero, getDenomFromIsoCode, roundedFee } from '../util/utils'
import { updateSwapCount } from './RequestReviewActions'

export interface SetNativeAmountInfo {
  whichWallet: 'from' | 'to'
  primaryNativeAmount: string
}

export function getQuoteForTransaction(info: SetNativeAmountInfo, onApprove: () => void): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    Actions.push('exchangeQuoteProcessing', {})

    const state = getState()
    const { fromWalletId, toWalletId, fromCurrencyCode, toCurrencyCode } = state.cryptoExchange
    try {
      if (fromWalletId == null || toWalletId == null) {
        throw new Error('No wallet selected') // Should never happen
      }
      if (fromCurrencyCode == null || toCurrencyCode == null) {
        throw new Error('No currency selected') // Should never happen
      }

      const { currencyWallets } = state.core.account
      const fromCoreWallet: EdgeCurrencyWallet = currencyWallets[fromWalletId]
      const toCoreWallet: EdgeCurrencyWallet = currencyWallets[toWalletId]
      const request: EdgeSwapRequest = {
        fromCurrencyCode,
        fromWallet: fromCoreWallet,
        nativeAmount: info.primaryNativeAmount,
        quoteFor: info.whichWallet,
        toCurrencyCode,
        toWallet: toCoreWallet
      }

      const swapInfo = await fetchSwapQuote(state, request)

      Actions.push('exchangeQuote', {
        swapInfo,
        onApprove
      })
      dispatch({ type: 'UPDATE_SWAP_QUOTE', data: swapInfo })
    } catch (error: any) {
      Actions.popTo('exchangeScene')
      const insufficientFunds = asMaybeInsufficientFundsError(error)
      if (insufficientFunds != null && insufficientFunds.currencyCode != null && fromCurrencyCode !== insufficientFunds.currencyCode && fromWalletId != null) {
        const { currencyCode, networkFee = '' } = insufficientFunds
        const multiplier = getExchangeDenomination(state, state.core.account.currencyWallets[fromWalletId].currencyInfo.pluginId, currencyCode).multiplier
        const amountString = roundedFee(networkFee, 2, multiplier)
        const result = await Airship.show<'buy' | 'exchange' | 'cancel' | undefined>(bridge => (
          <ButtonsModal
            bridge={bridge}
            title={s.strings.buy_crypto_modal_title}
            message={`${amountString}${sprintf(s.strings.buy_parent_crypto_modal_message, currencyCode)}`}
            buttons={{
              buy: { label: sprintf(s.strings.buy_crypto_modal_buy_action, currencyCode) },
              exchange: { label: s.strings.buy_crypto_modal_exchange, type: 'primary' },
              cancel: { label: s.strings.buy_crypto_decline }
            }}
          />
        ))
        switch (result) {
          case 'buy':
            Actions.jump('pluginListBuy', { direction: 'buy' })
            return
          case 'exchange':
            dispatch({ type: 'SHIFT_COMPLETE' })
            if (fromWalletId != null) {
              dispatch(selectWalletForExchange(fromWalletId, currencyCode, 'to'))
            }
            break
          case 'cancel':
          case undefined:
            break
        }
      }
      dispatch(processSwapQuoteError(error))
    }
  }
}

export function exchangeTimerExpired(swapInfo: GuiSwapInfo, onApprove: () => void): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    if (Actions.currentScene !== 'exchangeQuote') return
    Actions.push('exchangeQuoteProcessing', {})

    try {
      swapInfo = await fetchSwapQuote(getState(), swapInfo.request)
      Actions.push('exchangeQuote', {
        swapInfo,
        onApprove
      })
      dispatch({ type: 'UPDATE_SWAP_QUOTE', data: swapInfo })
    } catch (error: any) {
      Actions.popTo('exchangeScene')
      dispatch(processSwapQuoteError(error))
    }
  }
}

export function exchangeMax(): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState()
    const { fromWalletId } = state.cryptoExchange
    if (fromWalletId == null) {
      return
    }
    const { currencyWallets } = state.core.account
    const wallet: EdgeCurrencyWallet = currencyWallets[fromWalletId]
    const currencyCode = state.cryptoExchange.fromCurrencyCode ? state.cryptoExchange.fromCurrencyCode : undefined
    if (getSpecialCurrencyInfo(wallet.currencyInfo.pluginId).noMaxSpend) {
      const message = sprintf(s.strings.max_spend_unavailable_modal_message, wallet.currencyInfo.displayName)
      Alert.alert(s.strings.max_spend_unavailable_modal_title, message)
      return
    }
    const dummyPublicAddress = getSpecialCurrencyInfo(wallet.currencyInfo.pluginId).dummyPublicAddress
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
    } catch (error: any) {
      showError(error)
    }
    dispatch({ type: 'SET_FROM_WALLET_MAX', data: primaryNativeAmount })
  }
}

async function fetchSwapQuote(state: RootState, request: EdgeSwapRequest): Promise<GuiSwapInfo> {
  const { account } = state.core
  const { preferredSwapPluginType } = state.ui.settings

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
    preferType: preferredSwapPluginType,
    disabled: activePlugins.disabled,
    promoCodes: activePlugins.promoCodes
  })

  // Currency conversion tools:
  // Both fromCurrencyCode and toCurrencyCode will exist, since we set them:
  const { fromWallet, toWallet, fromCurrencyCode = '', toCurrencyCode = '' } = request

  // Format from amount:
  const fromPrimaryInfo = state.cryptoExchange.fromWalletPrimaryInfo
  const fromDisplayAmountTemp = div(quote.fromNativeAmount, fromPrimaryInfo.displayDenomination.multiplier, DECIMAL_PRECISION)
  const fromDisplayAmount = toFixed(fromDisplayAmountTemp, 0, 8)

  // Format from fiat:
  const fromExchangeDenomination = getExchangeDenomination(state, fromWallet.currencyInfo.pluginId, fromCurrencyCode)
  const fromBalanceInCryptoDisplay = convertNativeToExchange(fromExchangeDenomination.multiplier)(quote.fromNativeAmount)
  const fromBalanceInFiatRaw = parseFloat(convertCurrency(state, fromCurrencyCode, fromWallet.fiatCurrencyCode, fromBalanceInCryptoDisplay))
  const fromFiat = formatNumber(fromBalanceInFiatRaw || 0, { toFixed: 2 })

  // Format crypto fee:
  const feeDenomination = getDisplayDenomination(state, fromWallet.currencyInfo.pluginId, fromWallet.currencyInfo.currencyCode)
  const feeNativeAmount = quote.networkFee.nativeAmount
  const feeTempAmount = div(feeNativeAmount, feeDenomination.multiplier, DECIMAL_PRECISION)
  const feeDisplayAmount = toFixed(feeTempAmount, 0, 6)

  // Format fiat fee:
  const feeDenominatedAmount = await fromWallet.nativeToDenomination(feeNativeAmount, request.fromWallet.currencyInfo.currencyCode)
  const feeFiatAmountRaw = parseFloat(convertCurrency(state, request.fromWallet.currencyInfo.currencyCode, fromWallet.fiatCurrencyCode, feeDenominatedAmount))
  const feeFiatAmount = formatNumber(feeFiatAmountRaw || 0, { toFixed: 2 })
  const fee = `${feeDisplayAmount} ${feeDenomination.name} (${feeFiatAmount} ${fromWallet.fiatCurrencyCode.replace('iso:', '')})`
  const fromTotalFiat = formatNumber(add(fromBalanceInFiatRaw.toFixed(DECIMAL_PRECISION), feeFiatAmountRaw.toFixed(DECIMAL_PRECISION)), { toFixed: 2 })

  // Format to amount:
  const toPrimaryInfo = state.cryptoExchange.toWalletPrimaryInfo
  const toDisplayAmountTemp = div(quote.toNativeAmount, toPrimaryInfo.displayDenomination.multiplier, DECIMAL_PRECISION)
  const toDisplayAmount = toFixed(toDisplayAmountTemp, 0, 8)

  // Format to fiat:
  const toExchangeDenomination = getExchangeDenomination(state, toWallet.currencyInfo.pluginId, toCurrencyCode)
  const toBalanceInCryptoDisplay = convertNativeToExchange(toExchangeDenomination.multiplier)(quote.toNativeAmount)
  const toBalanceInFiatRaw = parseFloat(convertCurrency(state, toCurrencyCode, toWallet.fiatCurrencyCode, toBalanceInCryptoDisplay))
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

function processSwapQuoteError(error: unknown): ThunkAction<void> {
  return (dispatch, getState) => {
    const state = getState()
    const { fromWalletId, fromCurrencyCode, toWalletId, toCurrencyCode } = state.cryptoExchange

    // Basic sanity checks (should never fail):
    if (error == null) return
    if (fromWalletId == null || fromCurrencyCode == null || toWalletId == null || toCurrencyCode == null) return

    const fromWallet = state.core.account.currencyWallets[fromWalletId]
    const toWallet = state.core.account.currencyWallets[toWalletId]

    // Check for known error types:
    const insufficientFunds = asMaybeInsufficientFundsError(error)
    if (insufficientFunds != null) {
      return dispatch({ type: 'RECEIVED_INSUFFICIENT_FUNDS_ERROR' })
    }

    const aboveLimit = asMaybeSwapAboveLimitError(error)
    if (aboveLimit != null) {
      const wallet = aboveLimit.direction === 'to' ? toWallet : fromWallet
      const currencyCode = aboveLimit.direction === 'to' ? toCurrencyCode : fromCurrencyCode
      const currentCurrencyDenomination = getDisplayDenomination(state, wallet.currencyInfo.pluginId, currencyCode)

      const { nativeMax } = aboveLimit
      const nativeToDisplayRatio = currentCurrencyDenomination.multiplier
      const displayMax = convertNativeToDisplay(nativeToDisplayRatio)(nativeMax)

      return dispatch({
        type: 'GENERIC_SHAPE_SHIFT_ERROR',
        data: sprintf(s.strings.amount_above_limit, displayMax, currentCurrencyDenomination.name)
      })
    }

    const belowLimit = asMaybeSwapBelowLimitError(error)
    if (belowLimit) {
      const wallet = belowLimit.direction === 'to' ? toWallet : fromWallet
      const currencyCode = belowLimit.direction === 'to' ? toCurrencyCode : fromCurrencyCode
      const currentCurrencyDenomination = getDisplayDenomination(state, wallet.currencyInfo.pluginId, currencyCode)

      const { nativeMin } = belowLimit
      const nativeToDisplayRatio = currentCurrencyDenomination.multiplier
      const displayMin = convertNativeToDisplay(nativeToDisplayRatio)(nativeMin)

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
    if (permissionError?.reason === 'geoRestriction') {
      return dispatch({
        type: 'GENERIC_SHAPE_SHIFT_ERROR',
        data: s.strings.ss_geolock
      })
    }

    // Some plugins get this error wrong:
    const message = error instanceof Error ? error.message : String(error)
    if (message === 'InsufficientFundsError') {
      return dispatch({ type: 'RECEIVED_INSUFFICIENT_FUNDS_ERROR' })
    }

    // Anything else:
    return dispatch({
      type: 'GENERIC_SHAPE_SHIFT_ERROR',
      data: message
    })
  }
}

export function shiftCryptoCurrency(swapInfo: GuiSwapInfo, onApprove: () => void): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState()
    const { account } = state.core
    dispatch({ type: 'START_SHIFT_TRANSACTION' })

    const { fromDisplayAmount, quote, request, fee, fromFiat, fromTotalFiat, toDisplayAmount, toFiat } = swapInfo
    const { isEstimate, fromNativeAmount, toNativeAmount, networkFee, pluginId, expirationDate } = quote
    // Both fromCurrencyCode and toCurrencyCode will exist, since we set them:
    const { toWallet, fromCurrencyCode = '', toCurrencyCode = '' } = request
    try {
      logEvent('SwapStart')
      const { swapInfo } = account.swapConfig[pluginId]

      // Build the category string:
      const isTransfer = pluginId === 'transfer'
      const toWalletName = getWalletName(toWallet)
      const name = isTransfer ? toWalletName : swapInfo.displayName
      const swapType = isTransfer ? 'transfer' : 'exchange'
      const swapTarget = isTransfer ? toWalletName : toCurrencyCode
      const category = `${swapType}:${fromCurrencyCode} ${s.strings.word_to_in_convert_from_to_string} ${swapTarget}`

      const result: EdgeSwapResult = await quote.approve({ metadata: { name, category } })

      logActivity(`Swap Exchange Executed: ${account.username}`)
      logActivity(`
    fromDisplayAmount: ${fromDisplayAmount}
    fee: ${fee}
    fromFiat: ${fromFiat}
    fromTotalFiat: ${fromTotalFiat}
    toDisplayAmount: ${toDisplayAmount}
    toFiat: ${toFiat}
    quote:
      pluginId: ${pluginId}
      isEstimate: ${isEstimate.toString()}
      fromNativeAmount: ${fromNativeAmount}
      toNativeAmount: ${toNativeAmount}
      expirationDate: ${expirationDate ? expirationDate.toISOString() : 'no expiration'}
      networkFee:
        currencyCode ${networkFee.currencyCode}
        nativeAmount ${networkFee.nativeAmount}
`)

      Actions.push('exchangeSuccess', {})

      // Dispatch the success action and callback
      dispatch({ type: 'SHIFT_COMPLETE' })
      onApprove()

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
      // @ts-expect-error
      dispatch(trackConversion('SwapSuccess', trackConversionOpts))
    } catch (error: any) {
      console.log(error)
      logEvent('SwapFailed')
      dispatch({ type: 'DONE_SHIFT_TRANSACTION' })
      setTimeout(() => {
        showError(`${s.strings.exchange_failed}. ${error.message}`)
      }, 1)
    }
  }
}

export function selectWalletForExchange(walletId: string, currencyCode: string, direction: 'from' | 'to'): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState()
    const wallet = state.core.account.currencyWallets[walletId]
    const { currencyCode: chainCc, pluginId } = wallet.currencyInfo
    const cc = currencyCode || chainCc
    const balanceMessage = await getBalanceMessage(state, walletId, cc)
    const primaryDisplayDenomination: GuiDenomination = getDisplayDenomination(state, wallet.currencyInfo.pluginId, cc)
    const primaryExchangeDenomination: GuiDenomination = getExchangeDenomination(state, wallet.currencyInfo.pluginId, cc)
    const primaryInfo: GuiCurrencyInfo = {
      walletId,
      pluginId,
      displayCurrencyCode: cc,
      exchangeCurrencyCode: cc,
      displayDenomination: primaryDisplayDenomination,
      exchangeDenomination: primaryExchangeDenomination
    }

    const data = {
      walletId,
      balanceMessage,
      currencyCode: cc,
      primaryInfo
    }

    if (direction === 'from') {
      dispatch({ type: 'SELECT_FROM_WALLET_CRYPTO_EXCHANGE', data })
    } else {
      dispatch({ type: 'SELECT_TO_WALLET_CRYPTO_EXCHANGE', data })
    }
  }
}

export function checkEnabledExchanges(): ThunkAction<void> {
  return (dispatch, getState) => {
    const state = getState()
    const { account } = state.core
    // make sure exchanges are enabled
    let isAnyExchangeEnabled = false
    const exchanges = account.swapConfig
    for (const exchange of Object.keys(exchanges)) {
      if (exchanges[exchange].enabled) {
        isAnyExchangeEnabled = true
      }
    }

    if (!isAnyExchangeEnabled) {
      Alert.alert(s.strings.no_exchanges_available, s.strings.check_exchange_settings)
    }
  }
}

async function getBalanceMessage(state: RootState, walletId: string, currencyCode: string) {
  const { account } = state.core
  const { currencyWallets } = account
  const wallet = currencyWallets[walletId]
  const balanceInCrypto = wallet.balances[currencyCode] ?? '0'
  const isoFiatCurrencyCode = wallet.fiatCurrencyCode
  const exchangeDenomination = getExchangeDenomination(state, wallet.currencyInfo.pluginId, currencyCode)
  const balanceInCryptoDisplay = convertNativeToExchange(exchangeDenomination.multiplier)(balanceInCrypto)
  const balanceInFiat = parseFloat(convertCurrency(state, currencyCode, isoFiatCurrencyCode, balanceInCryptoDisplay))

  const displayDenomination = getDisplayDenomination(state, wallet.currencyInfo.pluginId, currencyCode)

  const cryptoBalanceAmount: string = convertNativeToDisplay(displayDenomination.multiplier)(balanceInCrypto) // convert to correct denomination
  const cryptoBalanceAmountString = cryptoBalanceAmount ? formatNumber(decimalOrZero(toFixed(cryptoBalanceAmount, 0, 6), 6)) : '0' // limit decimals and check if infitesimal, also cut off trailing zeroes (to right of significant figures)
  const balanceInFiatString = formatNumber(balanceInFiat || 0, { toFixed: 2 })

  const fiatCurrencyCode = getDenomFromIsoCode(isoFiatCurrencyCode)
  const fiatDisplayCode = fiatCurrencyCode.symbol

  if (fiatDisplayCode == null) return ''

  return 'Balance: ' + cryptoBalanceAmountString + ' ' + displayDenomination.name + ' (' + fiatDisplayCode + ' ' + balanceInFiatString + ')'
}
