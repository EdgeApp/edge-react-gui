import { add, div, toFixed } from 'biggystring'
import {
  asMaybeInsufficientFundsError,
  asMaybeSwapAboveLimitError,
  asMaybeSwapBelowLimitError,
  asMaybeSwapCurrencyError,
  asMaybeSwapPermissionError,
  EdgeSwapQuote,
  EdgeSwapRequest,
  EdgeSwapRequestOptions,
  EdgeSwapResult,
  EdgeTokenId
} from 'edge-core-js'
import { Alert } from 'react-native'
import { sprintf } from 'sprintf-js'

import { showError } from '../components/services/AirshipInstance'
import { formatNumber } from '../locales/intl'
import { lstrings } from '../locales/strings'
import { getExchangeDenom, getExchangeDenomByCurrencyCode, selectDisplayDenom, selectDisplayDenomByCurrencyCode } from '../selectors/DenominationSelectors'
import { convertCurrency } from '../selectors/WalletSelectors'
import { RootState, ThunkAction } from '../types/reduxTypes'
import { NavigationBase } from '../types/routerTypes'
import { GuiCurrencyInfo, GuiSwapInfo } from '../types/types'
import { CryptoAmount } from '../util/CryptoAmount'
import { getCurrencyCode } from '../util/CurrencyInfoHelpers'
import { logActivity } from '../util/logger'
import { logEvent } from '../util/tracking'
import { convertNativeToDisplay, convertNativeToExchange, DECIMAL_PRECISION, decimalOrZero, getDenomFromIsoCode } from '../util/utils'
import { updateSwapCount } from './RequestReviewActions'

export function getQuoteForTransaction(
  navigation: NavigationBase,
  swapRequest: EdgeSwapRequest,
  swapRequestOptions: EdgeSwapRequestOptions,
  onApprove: () => void
): ThunkAction<Promise<void>> {
  return async dispatch => {
    navigation.navigate('exchangeQuoteProcessing', {
      swapRequest,
      swapRequestOptions,
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
      }
    })
  }
}

export function exchangeTimerExpired(
  navigation: NavigationBase,
  quote: EdgeSwapQuote,
  swapRequestOptions: EdgeSwapRequestOptions,
  onApprove: () => void
): ThunkAction<Promise<void>> {
  return async dispatch => {
    navigation.replace('exchangeQuoteProcessing', {
      swapRequest: quote.request,
      swapRequestOptions,
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
      }
    })
  }
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
  const feeDenomination = selectDisplayDenom(state, fromWallet.currencyConfig, null)
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
  const toExchangeDenomination = getExchangeDenom(toWallet.currencyConfig, toTokenId)
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

export function processSwapQuoteError(error: unknown, request: EdgeSwapRequest): ThunkAction<void> {
  return (dispatch, getState) => {
    const state = getState()

    // Basic sanity checks (should never fail):
    if (error == null) return

    const { fromWallet, fromTokenId, toWallet, toTokenId } = request

    const fromCurrencyCode = getCurrencyCode(fromWallet, fromTokenId)
    const toCurrencyCode = getCurrencyCode(toWallet, toTokenId)

    if (fromCurrencyCode == null || toCurrencyCode == null) return

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

      dispatch(
        logEvent('Exchange_Shift_Success', {
          conversionValues: {
            conversionType: 'crypto',
            cryptoAmount: new CryptoAmount({
              nativeAmount: toNativeAmount,
              currencyCode: toCurrencyCode,
              currencyConfig: toWallet.currencyConfig
            }),
            orderId: result.orderId,
            swapProviderId: pluginId
          }
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

export function selectWalletForExchange(walletId: string, tokenId: EdgeTokenId, direction: 'from' | 'to'): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState()
    const wallet = state.core.account.currencyWallets[walletId]
    const cc = getCurrencyCode(wallet, tokenId)
    const balanceMessage = await getBalanceMessage(state, walletId, tokenId)
    const primaryDisplayDenomination = selectDisplayDenom(state, wallet.currencyConfig, tokenId)
    const primaryExchangeDenomination = getExchangeDenom(wallet.currencyConfig, tokenId)
    const primaryInfo: GuiCurrencyInfo = {
      walletId,
      tokenId,
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

async function getBalanceMessage(state: RootState, walletId: string, tokenId: EdgeTokenId) {
  const { account } = state.core
  const { currencyWallets } = account
  const wallet = currencyWallets[walletId]
  const currencyCode = getCurrencyCode(wallet, tokenId)

  const balanceInCrypto = wallet.balanceMap.get(tokenId) ?? '0'
  const isoFiatCurrencyCode = wallet.fiatCurrencyCode
  const exchangeDenomination = getExchangeDenomByCurrencyCode(wallet.currencyConfig, currencyCode)
  const balanceInCryptoDisplay = convertNativeToExchange(exchangeDenomination.multiplier)(balanceInCrypto)
  const balanceInFiat = parseFloat(convertCurrency(state, currencyCode, isoFiatCurrencyCode, balanceInCryptoDisplay))

  const displayDenomination = selectDisplayDenom(state, wallet.currencyConfig, tokenId)

  const cryptoBalanceAmount: string = convertNativeToDisplay(displayDenomination.multiplier)(balanceInCrypto) // convert to correct denomination
  const cryptoBalanceAmountString = cryptoBalanceAmount ? formatNumber(decimalOrZero(toFixed(cryptoBalanceAmount, 0, 6), 6)) : '0' // limit decimals and check if infitesimal, also cut off trailing zeroes (to right of significant figures)
  const balanceInFiatString = formatNumber(balanceInFiat || 0, { toFixed: 2 })

  const fiatCurrencyCode = getDenomFromIsoCode(isoFiatCurrencyCode)
  const fiatDisplayCode = fiatCurrencyCode.symbol

  if (fiatDisplayCode == null) return ''

  return 'Balance: ' + cryptoBalanceAmountString + ' ' + displayDenomination.name + ' (' + fiatDisplayCode + ' ' + balanceInFiatString + ')'
}
