import { abs, div, lt, toFixed } from 'biggystring'

import { getSymbolFromCurrency, USD_FIAT } from '../constants/WalletAndCurrencyConstants'
import { formatNumber } from '../locales/intl'
import { convertCurrency } from '../selectors/WalletSelectors'
import { useSelector } from '../types/reactRedux'
import { toBigNumberString } from '../util/toBigNumberString'
import { DECIMAL_PRECISION, zeroString } from '../util/utils'

const defaultMultiplier = Math.pow(10, DECIMAL_PRECISION).toString()
interface Props {
  appendFiatCurrencyCode?: boolean
  autoPrecision?: boolean
  cryptoCurrencyCode: string
  cryptoExchangeMultiplier?: string
  fiatSymbolSpace?: boolean
  hideFiatSymbol?: boolean
  isoFiatCurrencyCode?: string
  maxPrecision?: number
  minPrecision?: number
  nativeCryptoAmount?: string
  noGrouping?: boolean
  subCentTruncation?: boolean
}

export const useFiatText = (props: Props): string => {
  const {
    appendFiatCurrencyCode,
    autoPrecision,
    cryptoCurrencyCode,
    cryptoExchangeMultiplier = defaultMultiplier,
    fiatSymbolSpace,
    hideFiatSymbol,
    isoFiatCurrencyCode = USD_FIAT,
    maxPrecision,
    minPrecision,
    nativeCryptoAmount = cryptoExchangeMultiplier,
    noGrouping,
    subCentTruncation
  } = props

  // Convert native to fiat amount.
  // Does NOT take into account display denomination settings here,
  // i.e. sats, bits, etc.
  const fiatAmount = useSelector(state => {
    const cryptoAmount = div(nativeCryptoAmount, cryptoExchangeMultiplier, DECIMAL_PRECISION)
    return convertCurrency(state, cryptoCurrencyCode, isoFiatCurrencyCode, cryptoAmount)
  })

  const isSubCentTruncationActive = subCentTruncation && lt(abs(fiatAmount), '0.01')

  // Convert the amount to an internationalized string or '0'
  const fiatString =
    autoPrecision || !zeroString(fiatAmount)
      ? formatFiatString({
          fiatAmount: isSubCentTruncationActive ? '0.01' : fiatAmount,
          autoPrecision,
          minPrecision,
          maxPrecision: isSubCentTruncationActive ? 2 : maxPrecision,
          noGrouping
        })
      : '0'

  const lessThanSymbol = isSubCentTruncationActive ? '<' : ''
  const fiatSymbol = hideFiatSymbol ? '' : `${getSymbolFromCurrency(isoFiatCurrencyCode)}${fiatSymbolSpace ? ' ' : ''}`
  const fiatCurrencyCode = appendFiatCurrencyCode ? ` ${isoFiatCurrencyCode.replace('iso:', '')}` : ''
  return `${lessThanSymbol}${fiatSymbol}${fiatString}${fiatCurrencyCode}`
}

export const formatFiatString = (props: {
  autoPrecision?: boolean
  fiatAmount: string
  noGrouping?: boolean
  minPrecision?: number
  maxPrecision?: number
}): string => {
  const { fiatAmount, minPrecision = 2, maxPrecision = 6, autoPrecision = true, noGrouping = false } = props

  // Use US locale delimiters for determining precision
  const fiatAmtCleanedDelim = fiatAmount.replace(',', '.')
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
  return displayFiatAmount(fiatAmtCleanedDelim, precision, noGrouping)
}

/**
 * Returns a localized fiat amount string
 * */
export const displayFiatAmount = (fiatAmount?: number | string, precision: number = 2, noGrouping: boolean = true) => {
  const fiatAmountBns = fiatAmount != null ? toBigNumberString(fiatAmount) : undefined
  if (fiatAmountBns == null || fiatAmountBns === '0') return precision > 0 ? formatNumber('0.' + '0'.repeat(precision)) : '0'
  const absoluteAmount = abs(fiatAmountBns)
  return formatNumber(toFixed(absoluteAmount, precision, precision), { noGrouping })
}
