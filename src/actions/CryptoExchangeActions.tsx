import { add, div, toFixed } from 'biggystring'
import { EdgeSwapQuote } from 'edge-core-js'
import { Alert } from 'react-native'

import {} from '../components/services/AirshipInstance'
import { formatNumber } from '../locales/intl'
import { lstrings } from '../locales/strings'
import { getExchangeDenom, selectDisplayDenom } from '../selectors/DenominationSelectors'
import { convertCurrency } from '../selectors/WalletSelectors'
import { ThunkAction } from '../types/reduxTypes'
import { GuiSwapInfo } from '../types/types'
import { getCurrencyCode } from '../util/CurrencyInfoHelpers'
import { convertNativeToExchange, DECIMAL_PRECISION } from '../util/utils'

// TODO: Use new hooks and utility methods for all conversions here
export const getSwapInfo = (quote: EdgeSwapQuote): ThunkAction<Promise<GuiSwapInfo>> => {
  return async (_dispatch, getState) => {
    const state = getState()

    // Currency conversion tools:
    // Both fromCurrencyCode and toCurrencyCode will exist, since we set them:
    const { request } = quote
    const { fromWallet, toWallet, fromTokenId, toTokenId } = request
    const fromCurrencyCode = getCurrencyCode(fromWallet, fromTokenId)
    const toCurrencyCode = getCurrencyCode(toWallet, toTokenId)

    // Format from amount:
    const fromDisplayDenomination = selectDisplayDenom(state, fromWallet.currencyConfig, fromTokenId)
    const fromDisplayAmountTemp = div(quote.fromNativeAmount, fromDisplayDenomination.multiplier, DECIMAL_PRECISION)
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
    const toDisplayDenomination = selectDisplayDenom(state, toWallet.currencyConfig, toTokenId)
    const toDisplayAmountTemp = div(quote.toNativeAmount, toDisplayDenomination.multiplier, DECIMAL_PRECISION)
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
