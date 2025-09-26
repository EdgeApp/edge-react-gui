import { abs, add, div, lt, toFixed } from 'biggystring'
import type { EdgeTokenId } from 'edge-core-js'

import {
  getFiatSymbol,
  USD_FIAT
} from '../constants/WalletAndCurrencyConstants'
import { formatNumber } from '../locales/intl'
import { lstrings } from '../locales/strings'
import { convertCurrency } from '../selectors/WalletSelectors'
import { useSelector } from '../types/reactRedux'
import { DECIMAL_PRECISION, removeIsoPrefix, zeroString } from '../util/utils'

const defaultMultiplier = Math.pow(10, DECIMAL_PRECISION).toString()

interface Props {
  cryptoExchangeMultiplier?: string
  nativeCryptoAmount?: string
  isoFiatCurrencyCode?: string
  pluginId: string
  tokenId: EdgeTokenId

  maxPrecision?: number
  minPrecision?: number

  /** Show the fiat name after the number, like "USD" */
  appendFiatCurrencyCode?: boolean

  /**
   * Automatically add more decimal places to show small numbers.
   * Defaults to true.
   */
  autoPrecision?: boolean

  /** Show 0 as "0" without any decimals. Defaults to true. */
  displayZeroAsInteger?: boolean

  /** Put a space after the fiat symbol, like "$ 1.00" */
  fiatSymbolSpace?: boolean

  /** Show a placeholder instead of the value */
  hideBalance?: boolean

  /** Remove the fiat symbol (no $) */
  hideFiatSymbol?: boolean

  /** Don't group digits for long numbers */
  noGrouping?: boolean

  /** Round small values to "0.01" */
  subCentTruncation?: boolean
}

export const useFiatText = (props: Props): string => {
  const {
    cryptoExchangeMultiplier = defaultMultiplier,
    nativeCryptoAmount = cryptoExchangeMultiplier,
    isoFiatCurrencyCode = USD_FIAT,
    pluginId,
    tokenId,
    maxPrecision,
    minPrecision,

    appendFiatCurrencyCode = false,
    autoPrecision = true,
    displayZeroAsInteger = true,
    fiatSymbolSpace = false,
    hideBalance = false,
    hideFiatSymbol = false,
    noGrouping = false,
    subCentTruncation = false
  } = props

  // Convert native to fiat amount.
  // Does NOT take into account display denomination settings here,
  // i.e. sats, bits, etc.
  const fiatAmount = useSelector(state => {
    const cryptoAmount = div(
      nativeCryptoAmount,
      cryptoExchangeMultiplier,
      DECIMAL_PRECISION
    )
    return convertCurrency(
      state.exchangeRates,
      pluginId,
      tokenId,
      isoFiatCurrencyCode,
      cryptoAmount
    )
  })

  const isSubCentTruncationActive =
    subCentTruncation && lt(abs(fiatAmount), '0.01')

  // Use a placeholder if we are hidding the balance:
  const fiatString = hideBalance
    ? lstrings.redacted_placeholder
    : // Flatten 0's:
    displayZeroAsInteger && zeroString(fiatAmount)
    ? '0'
    : // Normal decimal formatting:
      formatFiatString({
        fiatAmount: isSubCentTruncationActive ? '0.01' : fiatAmount,
        autoPrecision,
        minPrecision,
        maxPrecision: isSubCentTruncationActive ? 2 : maxPrecision,
        noGrouping
      })

  const lessThanSymbol = isSubCentTruncationActive ? '<' : ''
  const fiatSymbol = hideFiatSymbol
    ? ''
    : `${getFiatSymbol(isoFiatCurrencyCode)}${
        fiatSymbolSpace || hideBalance ? ' ' : ''
      }`
  const fiatCurrencyCode = appendFiatCurrencyCode
    ? ` ${removeIsoPrefix(isoFiatCurrencyCode)}`
    : ''
  return `${lessThanSymbol}${fiatSymbol}${fiatString}${fiatCurrencyCode}`
}

export const formatFiatString = (props: {
  autoPrecision?: boolean
  fiatAmount: string
  noGrouping?: boolean
  minPrecision?: number
  maxPrecision?: number
}): string => {
  const {
    autoPrecision = true,
    fiatAmount,
    maxPrecision = 6,
    minPrecision = 2,
    noGrouping = false
  } = props

  // Assume any spaces means this is some truncated '1.23 Bn' or '3.45 M' string
  const [fiatAmountCleanedMag, magnitudeCode] = fiatAmount.split(' ')
  const magnitudeCodeStr = magnitudeCode == null ? '' : ` ${magnitudeCode}`

  // Use US locale delimiters for determining precision
  const fiatAmtCleanedDelim = fiatAmountCleanedMag.replace(',', '.')
  let precision = minPrecision
  let tempFiatAmount = parseFloat(fiatAmtCleanedDelim)
  if (autoPrecision) {
    if (Math.log10(tempFiatAmount) >= 3) {
      // Drop decimals if over '1000' of any fiat currency
      precision = 0
    }
    while (tempFiatAmount <= 1 && tempFiatAmount > 0) {
      tempFiatAmount *= 10
      precision += precision < maxPrecision ? 1 : 0
    }
  }

  // Convert back to a localized fiat amount string with specified precision and grouping
  return `${displayFiatAmount(
    fiatAmtCleanedDelim,
    precision,
    noGrouping
  )}${magnitudeCodeStr}`
}

/**
 * Returns a localized fiat amount string
 * */
export const displayFiatAmount = (
  fiatAmount?: number | string,
  precision: number = 2,
  noGrouping: boolean = true
): string => {
  const fiatAmountBns = fiatAmount != null ? add(fiatAmount, '0') : undefined
  if (fiatAmountBns == null || fiatAmountBns === '0') {
    return precision > 0 ? formatNumber('0.' + '0'.repeat(precision)) : '0'
  }
  const absoluteAmount = abs(fiatAmountBns)
  return formatNumber(toFixed(absoluteAmount, precision, precision), {
    noGrouping
  })
}
