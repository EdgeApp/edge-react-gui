import { add, div, toFixed } from 'biggystring'
import {
  asMaybeInsufficientFundsError,
  asMaybeSwapAboveLimitError,
  asMaybeSwapBelowLimitError,
  asMaybeSwapCurrencyError,
  asMaybeSwapPermissionError,
  EdgeCurrencyWallet,
  EdgeSwapQuote,
  EdgeSwapRequest,
  EdgeSwapResult
} from 'edge-core-js'
import * as React from 'react'
import { Alert } from 'react-native'
import { sprintf } from 'sprintf-js'

import { InsufficientFeesModal } from '../components/modals/InsufficientFeesModal'
import { Airship, showError } from '../components/services/AirshipInstance'
import { formatNumber } from '../locales/intl'
import { lstrings } from '../locales/strings'
import { getExchangeDenom, getExchangeDenomByCurrencyCode, selectDisplayDenomByCurrencyCode } from '../selectors/DenominationSelectors'
import { convertCurrency } from '../selectors/WalletSelectors'
import { RootState, ThunkAction } from '../types/reduxTypes'
import { NavigationBase } from '../types/routerTypes'
import { GuiCurrencyInfo, GuiSwapInfo } from '../types/types'
import { getCurrencyCode, getTokenIdForced, getWalletTokenId } from '../util/CurrencyInfoHelpers'
import { logActivity } from '../util/logger'
import { bestOfPlugins } from '../util/ReferralHelpers'
import { logEvent } from '../util/tracking'
import { convertNativeToDisplay, convertNativeToExchange, DECIMAL_PRECISION, decimalOrZero, getDenomFromIsoCode } from '../util/utils'
import { updateSwapCount } from './RequestReviewActions'

export interface SetNativeAmountInfo {
  whichWallet: 'from' | 'to' | 'max'
  primaryNativeAmount: string
}

export function getQuoteForTransaction(navigation: NavigationBase, info: SetNativeAmountInfo, onApprove: () => void): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState()
    const { fromWalletId, toWalletId, fromCurrencyCode, toCurrencyCode } = state.cryptoExchange

    if (fromWalletId == null || toWalletId == null) {
      throw new Error('No wallet selected') // Should never happen
    }
    if (fromCurrencyCode == null || toCurrencyCode == null) {
      throw new Error('No currency selected') // Should never happen
    }

    const { currencyWallets } = state.core.account
    const fromCoreWallet: EdgeCurrencyWallet = currencyWallets[fromWalletId]
    const toCoreWallet: EdgeCurrencyWallet = currencyWallets[toWalletId]

    const fromTokenId = getWalletTokenId(fromCoreWallet, fromCurrencyCode)
    const toTokenId = getWalletTokenId(toCoreWallet, toCurrencyCode)

    const request: EdgeSwapRequest = {
      fromTokenId,
      fromWallet: fromCoreWallet,
      nativeAmount: info.primaryNativeAmount,
      quoteFor: info.whichWallet,
      toTokenId,
      toWallet: toCoreWallet
    }

    navigation.navigate('exchangeQuoteProcessing', {
      fetchSwapQuotesPromise: fetchSwapQuotes(state, request),
      onCancel: () => {
        navigation.goBack()
      },
      onDone: quotes => {
        navigation.replace('exchangeQuote', {
          selectedQuote: quotes[0],
          quotes,
          onApprove
        })
        dispatch({ type: 'UPDATE_SWAP_QUOTE', data: {} })
      },
      onError: async (error: any) => {
        navigation.navigate('exchangeTab', { screen: 'exchange' })

        const insufficientFunds = asMaybeInsufficientFundsError(error)
        if (insufficientFunds != null && fromWalletId != null && fromTokenId !== insufficientFunds.tokenId) {
          const { tokenId } = insufficientFunds
          const { currencyWallets } = state.core.account
          const fromWallet = currencyWallets[fromWalletId]
          const currencyCode = getCurrencyCode(fromWallet, tokenId)

          await Airship.show(bridge => (
            <InsufficientFeesModal
              bridge={bridge}
              coreError={insufficientFunds}
              navigation={navigation}
              wallet={fromWallet}
              onSwap={() => {
                dispatch({ type: 'SHIFT_COMPLETE' })
                dispatch(selectWalletForExchange(fromWalletId, currencyCode, 'to')).catch(err => showError(err))
              }}
            />
          ))
        }
        dispatch(processSwapQuoteError(error))
      }
    })
  }
}

export function exchangeTimerExpired(navigation: NavigationBase, quote: EdgeSwapQuote, onApprove: () => void): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    navigation.replace('exchangeQuoteProcessing', {
      fetchSwapQuotesPromise: fetchSwapQuotes(getState(), quote.request),
      onCancel: () => {
        navigation.navigate('exchangeTab', { screen: 'exchange' })
      },
      onDone: quotes => {
        navigation.replace('exchangeQuote', {
          selectedQuote: quotes[0],
          quotes,
          onApprove
        })
        dispatch({ type: 'UPDATE_SWAP_QUOTE', data: {} })
      },
      onError: async (error: any) => {
        navigation.navigate('exchangeTab', { screen: 'exchange' })
        dispatch(processSwapQuoteError(error))
      }
    })
  }
}

async function fetchSwapQuotes(state: RootState, request: EdgeSwapRequest): Promise<EdgeSwapQuote[]> {
  const { account } = state.core
  const {
    exchangeInfo: {
      swap: { disablePlugins }
    },
    settings
  } = state.ui
  const { preferredSwapPluginType } = settings

  // Find preferred swap provider:
  const activePlugins = bestOfPlugins(state.account.referralCache.accountPlugins, state.account.accountReferral, state.ui.settings.preferredSwapPluginId)
  const preferPluginId = activePlugins.preferredSwapPluginId
  if (preferPluginId != null) {
    const { swapSource } = activePlugins
    const reason = swapSource.type === 'promotion' ? 'promo ' + swapSource.installerId : swapSource.type
    console.log(`Preferring ${preferPluginId} from ${reason}`)
  }

  // Get the quote:
  const quotes: EdgeSwapQuote[] = await account.fetchSwapQuotes(request, {
    disabled: { ...activePlugins.disabled, ...disablePlugins },
    noResponseMs: 60 * 1000,
    preferPluginId,
    preferType: preferredSwapPluginType,
    promoCodes: activePlugins.promoCodes,
    slowResponseMs: 10 * 1000
  })

  return quotes
}

// TODO: Use new hooks and utility methods for all conversions here
export const getSwapInfo = async (state: RootState, quote: EdgeSwapQuote): Promise<GuiSwapInfo> => {
  // Currency conversion tools:
  // Both fromCurrencyCode and toCurrencyCode will exist, since we set them:
  const { request } = quote
  const { fromWallet, toWallet, fromTokenId, toTokenId } = request
  const fromCurrencyCode = getCurrencyCode(fromWallet, fromTokenId)
  const toCurrencyCode = getCurrencyCode(toWallet, toTokenId)

  // Format from amount:
  const fromPrimaryInfo = state.cryptoExchange.fromWalletPrimaryInfo
  const fromDisplayAmountTemp = div(quote.fromNativeAmount, fromPrimaryInfo.displayDenomination.multiplier, DECIMAL_PRECISION)
  const fromDisplayAmount = toFixed(fromDisplayAmountTemp, 0, 8)

  // Format from fiat:
  const fromExchangeDenomination = getExchangeDenom(fromWallet.currencyConfig, fromTokenId)
  const fromBalanceInCryptoDisplay = convertNativeToExchange(fromExchangeDenomination.multiplier)(quote.fromNativeAmount)
  const fromBalanceInFiatRaw = parseFloat(convertCurrency(state, fromCurrencyCode, fromWallet.fiatCurrencyCode, fromBalanceInCryptoDisplay))
  const fromFiat = formatNumber(fromBalanceInFiatRaw || 0, { toFixed: 2 })

  // Format crypto fee:
  const feeDenomination = selectDisplayDenomByCurrencyCode(state, fromWallet.currencyConfig, fromWallet.currencyInfo.currencyCode)
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
  const toExchangeDenomination = getExchangeDenomByCurrencyCode(toWallet.currencyConfig, toCurrencyCode)
  const toBalanceInCryptoDisplay = convertNativeToExchange(toExchangeDenomination.multiplier)(quote.toNativeAmount)
  const toBalanceInFiatRaw = parseFloat(convertCurrency(state, toCurrencyCode, toWallet.fiatCurrencyCode, toBalanceInCryptoDisplay))
  const toFiat = formatNumber(toBalanceInFiatRaw || 0, { toFixed: 2 })

  const swapInfo: GuiSwapInfo = {
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
      const currentCurrencyDenomination = selectDisplayDenomByCurrencyCode(state, wallet.currencyConfig, currencyCode)

      const { nativeMax } = aboveLimit
      const nativeToDisplayRatio = currentCurrencyDenomination.multiplier
      const displayMax = convertNativeToDisplay(nativeToDisplayRatio)(nativeMax)

      return dispatch({
        type: 'GENERIC_SHAPE_SHIFT_ERROR',
        data: sprintf(lstrings.amount_above_limit, displayMax, currentCurrencyDenomination.name)
      })
    }

    const belowLimit = asMaybeSwapBelowLimitError(error)
    if (belowLimit) {
      const wallet = belowLimit.direction === 'to' ? toWallet : fromWallet
      const currencyCode = belowLimit.direction === 'to' ? toCurrencyCode : fromCurrencyCode
      const currentCurrencyDenomination = selectDisplayDenomByCurrencyCode(state, wallet.currencyConfig, currencyCode)

      const { nativeMin } = belowLimit
      const nativeToDisplayRatio = currentCurrencyDenomination.multiplier
      const displayMin = convertNativeToDisplay(nativeToDisplayRatio)(nativeMin)

      return dispatch({
        type: 'GENERIC_SHAPE_SHIFT_ERROR',
        data: sprintf(lstrings.amount_below_limit, displayMin, currentCurrencyDenomination.name)
      })
    }

    const currencyError = asMaybeSwapCurrencyError(error)
    if (currencyError != null) {
      return dispatch({
        type: 'GENERIC_SHAPE_SHIFT_ERROR',
        data: sprintf(lstrings.ss_unable, fromCurrencyCode, toCurrencyCode)
      })
    }

    const permissionError = asMaybeSwapPermissionError(error)
    if (permissionError?.reason === 'geoRestriction') {
      return dispatch({
        type: 'GENERIC_SHAPE_SHIFT_ERROR',
        data: lstrings.ss_geolock
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

export function shiftCryptoCurrency(navigation: NavigationBase, quote: EdgeSwapQuote, onApprove: () => void): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState()
    const { account } = state.core
    dispatch({ type: 'START_SHIFT_TRANSACTION' })

    const { fromDisplayAmount, fee, fromFiat, fromTotalFiat, toDisplayAmount, toFiat } = await getSwapInfo(state, quote)
    const { isEstimate, fromNativeAmount, toNativeAmount, networkFee, pluginId, expirationDate, request } = quote
    // Both fromCurrencyCode and toCurrencyCode will exist, since we set them:
    const { toWallet, toTokenId } = request
    const toCurrencyCode = getCurrencyCode(toWallet, toTokenId)
    try {
      dispatch(logEvent('Exchange_Shift_Start'))
      const result: EdgeSwapResult = await quote.approve()

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

      navigation.push('exchangeSuccess', {})

      // Dispatch the success action and callback
      dispatch({ type: 'SHIFT_COMPLETE' })
      onApprove()

      await updateSwapCount(state)

      const exchangeAmount = await toWallet.nativeToDenomination(toNativeAmount, toCurrencyCode)
      dispatch(
        logEvent('Exchange_Shift_Success', {
          pluginId,
          currencyCode: toCurrencyCode,
          exchangeAmount,
          orderId: result.orderId
        })
      )
    } catch (error: any) {
      console.log(error)
      dispatch(logEvent('Exchange_Shift_Failed', { error: String(error) })) // TODO: Do we need to parse/clean all cases?
      dispatch({ type: 'DONE_SHIFT_TRANSACTION' })
      setTimeout(() => {
        showError(`${lstrings.exchange_failed}. ${error.message}`)
      }, 1)
    }
  }
}

export function selectWalletForExchange(walletId: string, currencyCode: string, direction: 'from' | 'to'): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState()
    const wallet = state.core.account.currencyWallets[walletId]
    const { currencyCode: chainCc } = wallet.currencyInfo
    const cc = currencyCode || chainCc
    const balanceMessage = await getBalanceMessage(state, walletId, cc)
    const primaryDisplayDenomination = selectDisplayDenomByCurrencyCode(state, wallet.currencyConfig, cc)
    const primaryExchangeDenomination = getExchangeDenomByCurrencyCode(wallet.currencyConfig, cc)
    const primaryInfo: GuiCurrencyInfo = {
      walletId,
      tokenId: getTokenIdForced(state.core.account, wallet.currencyInfo.pluginId, cc),
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
    if (exchanges == null) return
    for (const exchange of Object.keys(exchanges)) {
      if (exchanges[exchange].enabled) {
        isAnyExchangeEnabled = true
      }
    }

    if (!isAnyExchangeEnabled) {
      Alert.alert(lstrings.no_exchanges_available, lstrings.check_exchange_settings)
    }
  }
}

async function getBalanceMessage(state: RootState, walletId: string, currencyCode: string) {
  const { account } = state.core
  const { currencyWallets } = account
  const wallet = currencyWallets[walletId]
  const tokenId = getWalletTokenId(wallet, currencyCode)

  const balanceInCrypto = wallet.balanceMap.get(tokenId) ?? '0'
  const isoFiatCurrencyCode = wallet.fiatCurrencyCode
  const exchangeDenomination = getExchangeDenomByCurrencyCode(wallet.currencyConfig, currencyCode)
  const balanceInCryptoDisplay = convertNativeToExchange(exchangeDenomination.multiplier)(balanceInCrypto)
  const balanceInFiat = parseFloat(convertCurrency(state, currencyCode, isoFiatCurrencyCode, balanceInCryptoDisplay))

  const displayDenomination = selectDisplayDenomByCurrencyCode(state, wallet.currencyConfig, currencyCode)

  const cryptoBalanceAmount: string = convertNativeToDisplay(displayDenomination.multiplier)(balanceInCrypto) // convert to correct denomination
  const cryptoBalanceAmountString = cryptoBalanceAmount ? formatNumber(decimalOrZero(toFixed(cryptoBalanceAmount, 0, 6), 6)) : '0' // limit decimals and check if infitesimal, also cut off trailing zeroes (to right of significant figures)
  const balanceInFiatString = formatNumber(balanceInFiat || 0, { toFixed: 2 })

  const fiatCurrencyCode = getDenomFromIsoCode(isoFiatCurrencyCode)
  const fiatDisplayCode = fiatCurrencyCode.symbol

  if (fiatDisplayCode == null) return ''

  return 'Balance: ' + cryptoBalanceAmountString + ' ' + displayDenomination.name + ' (' + fiatDisplayCode + ' ' + balanceInFiatString + ')'
}
