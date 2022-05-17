// @flow
import { abs, div, toFixed } from 'biggystring'

import { getSymbolFromCurrency, USD_FIAT } from '../constants/WalletAndCurrencyConstants.js'
import { formatNumber } from '../locales/intl.js'
import { convertCurrency } from '../selectors/WalletSelectors.js'
import { useSelector } from '../types/reactRedux.js'
import { DECIMAL_PRECISION, zeroString } from '../util/utils'

const defaultMultiplier = Math.pow(10, DECIMAL_PRECISION).toString()
type Props = {
  appendFiatCurrencyCode?: boolean,
  autoPrecision?: boolean,
  cryptoCurrencyCode: string,
  cryptoExchangeMultiplier?: string,
  fiatSymbolSpace?: boolean,
  isoFiatCurrencyCode?: string,
  nativeCryptoAmount?: string,
  noGrouping?: boolean
}

export const useFiatText = (props: Props): string => {
  const {
    appendFiatCurrencyCode,
    autoPrecision,
    cryptoCurrencyCode,
    cryptoExchangeMultiplier = defaultMultiplier,
    fiatSymbolSpace,
    isoFiatCurrencyCode = USD_FIAT,
    nativeCryptoAmount = cryptoExchangeMultiplier,
    noGrouping = false
  } = props

  // Convert native to fiat amount.
  // Does NOT take into account display denomination settings here,
  // i.e. sats, bits, etc.
  const fiatAmount = useSelector(state => {
    const cryptoAmount = div(nativeCryptoAmount, cryptoExchangeMultiplier, DECIMAL_PRECISION)
    return convertCurrency(state, cryptoCurrencyCode, isoFiatCurrencyCode, cryptoAmount)
  })

  // Convert the amount to an internationalized string or '0'
  const fiatString =
    autoPrecision || !zeroString(fiatAmount)
      ? formatFiatString({
          fiatAmount,
          autoPrecision,
          noGrouping
        })
      : '0'

  const fiatSymbol = `${getSymbolFromCurrency(isoFiatCurrencyCode)}${fiatSymbolSpace ? ' ' : ''}`
  const fiatCurrencyCode = appendFiatCurrencyCode ? ` ${isoFiatCurrencyCode.replace('iso:', '')}` : ''
  return `${fiatSymbol}${fiatString}${fiatCurrencyCode}`
}

const formatFiatString = (props: { autoPrecision?: boolean, fiatAmount: string, noGrouping?: boolean, minPrecision?: string }): string => {
  const { fiatAmount, minPrecision = 2, autoPrecision = false, noGrouping = true } = props

  // Use US locale delimeters for determining precision
  const fiatAmtCleanedDelim = fiatAmount.toString().replace(',', '.')
  let precision: number = parseInt(minPrecision)
  let tempFiatAmount = parseFloat(fiatAmtCleanedDelim)
  if (autoPrecision) {
    if (Math.log10(tempFiatAmount) >= 3) {
      // Drop decimals if over '1000' of any fiat currency
      precision = 0
    }
    while (tempFiatAmount <= 0.1 && tempFiatAmount > 0) {
      tempFiatAmount *= 10
      precision++
    }
  }

  // Convert back to a localized fiat amount string with specified precision and grouping
  return displayFiatAmount(parseFloat(fiatAmtCleanedDelim), precision, noGrouping)
}

/**
 * Returns a localized fiat amount string
 * */
export const displayFiatAmount = (fiatAmount?: number, precision?: number = 2, noGrouping?: boolean = true) => {
  if (fiatAmount == null || fiatAmount === 0) return precision > 0 ? formatNumber('0.' + '0'.repeat(precision)) : '0'
  const initialAmount = fiatAmount.toFixed(precision)
  const absoluteAmount = abs(initialAmount)
  return formatNumber(toFixed(absoluteAmount, precision, precision), { noGrouping })
}
