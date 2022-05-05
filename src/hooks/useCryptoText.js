// @flow
import { div, log10 } from 'biggystring'
import { type EdgeDenomination } from 'edge-core-js'

import { formatNumber } from '../locales/intl'
import {
  DECIMAL_PRECISION,
  decimalOrZero,
  DEFAULT_TRUNCATE_PRECISION,
  maxPrimaryCurrencyConversionDecimals,
  precisionAdjust,
  truncateDecimals as nonLocalTruncateDecimals,
  zeroString
} from '../util/utils'

type UseCryptoTextParams = {
  denomination: EdgeDenomination,
  exchangeRate?: string,
  fiatDenomination: EdgeDenomination,
  nativeAmount: string,
  tokenId?: string
}

export const useCryptoText = ({ denomination, fiatDenomination, exchangeRate, nativeAmount, tokenId }: UseCryptoTextParams) => {
  const { multiplier, symbol } = denomination
  if (zeroString(nativeAmount)) return `${symbol ? symbol + ' ' : ''}0`
  let maxConversionDecimals = DEFAULT_TRUNCATE_PRECISION

  if (exchangeRate != null) {
    const precisionAdjustValue = precisionAdjust({
      primaryExchangeMultiplier: multiplier,
      secondaryExchangeMultiplier: fiatDenomination.multiplier,
      exchangeSecondaryToPrimaryRatio: exchangeRate
    })
    maxConversionDecimals = maxPrimaryCurrencyConversionDecimals(log10(multiplier), precisionAdjustValue)
  }

  try {
    const preliminaryCryptoAmount = nonLocalTruncateDecimals(div(nativeAmount, multiplier, DECIMAL_PRECISION), maxConversionDecimals)
    const finalCryptoAmount = formatNumber(decimalOrZero(preliminaryCryptoAmount, maxConversionDecimals)) // check if infinitesimal (would display as zero), cut off trailing zeroes
    return `${symbol != null ? symbol + ' ' : ''}${finalCryptoAmount}`
  } catch (error) {
    if (error.message === 'Cannot operate on base16 float values') {
      const errorMessage = `${error.message}: Currency - ${denomination.name}, amount - ${nativeAmount}, demonination multiplier: ${multiplier}`
      console.error(errorMessage)
    }
    console.error(error)
  }

  return ''
}
