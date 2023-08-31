import { div, log10 } from 'biggystring'
import { EdgeDenomination } from 'edge-core-js'

import { formatNumber } from '../locales/intl'
import {
  DECIMAL_PRECISION,
  decimalOrZero,
  DEFAULT_TRUNCATE_PRECISION,
  maxPrimaryCurrencyConversionDecimals,
  precisionAdjust,
  truncateDecimals as nonLocalTruncateDecimals,
  zeroString
} from './utils'

interface GetCryptoTextParams {
  currencyCode?: string
  displayDenomination: EdgeDenomination
  exchangeDenomination: EdgeDenomination
  exchangeRate?: string
  fiatDenomination?: EdgeDenomination
  nativeAmount: string
}

/**
 * Get the numeric crypto text string value, factoring in exchange rate, denominations, etc.
 * TODO: Break this up once crypto & fiat text display logic is centralized into the appropriate text hooks/components. The order of operations should always be as follows:
 * 1. Numeric calculations
 * 2. Display Denomination
 * 3. Localization: commas, decimals, spaces
 */
export const getCryptoText = ({
  displayDenomination,
  exchangeDenomination,
  fiatDenomination,
  exchangeRate,
  nativeAmount,
  currencyCode
}: GetCryptoTextParams) => {
  const { multiplier: displayMultiplier, symbol } = displayDenomination
  const { multiplier: exchangeMultiplier } = exchangeDenomination

  if (zeroString(nativeAmount)) return `${symbol ? symbol + ' ' : ''}0${currencyCode ? ' ' + currencyCode : ''}`

  let maxConversionDecimals = DEFAULT_TRUNCATE_PRECISION
  if (exchangeRate != null && fiatDenomination != null && parseFloat(exchangeRate) > 0) {
    const precisionAdjustValue = precisionAdjust({
      primaryExchangeMultiplier: exchangeMultiplier,
      secondaryExchangeMultiplier: fiatDenomination.multiplier,
      exchangeSecondaryToPrimaryRatio: exchangeRate
    })
    maxConversionDecimals = maxPrimaryCurrencyConversionDecimals(log10(displayMultiplier), precisionAdjustValue)
  }

  try {
    const truncatedCryptoAmount = nonLocalTruncateDecimals(div(nativeAmount, displayMultiplier, DECIMAL_PRECISION), maxConversionDecimals)
    const finalCryptoAmount = formatNumber(decimalOrZero(truncatedCryptoAmount, maxConversionDecimals)) // check if infinitesimal (would display as zero), cut off trailing zeroes

    if (currencyCode != null) {
      // Display with currency code if provided
      return `${finalCryptoAmount} ${currencyCode}`
    }

    // Display with symbol (if available)
    return `${symbol != null ? symbol + ' ' : ''}${finalCryptoAmount}`
  } catch (error: any) {
    if (error.message === 'Cannot operate on base16 float values') {
      const errorMessage = `${error.message}: Currency - ${exchangeDenomination.name}, amount - ${nativeAmount}, demonination multiplier: ${displayMultiplier}, exchange multiplier: ${exchangeMultiplier}`
      console.error(errorMessage)
    }
    console.error(error)
  }

  return ''
}
