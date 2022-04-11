// @flow
import { div } from 'biggystring'

import { getSymbolFromCurrency, USD_FIAT } from '../constants/WalletAndCurrencyConstants.js'
import { trimEnd } from '../locales/intl.js'
import { convertCurrency } from '../selectors/WalletSelectors.js'
import { useSelector } from '../types/reactRedux.js'
import { DECIMAL_PRECISION, formatFiatString } from '../util/utils'

const defaultMultiplier = Math.pow(10, DECIMAL_PRECISION).toString()
type Props = {
  cryptoCurrencyCode: string,
  cryptoExchangeMultiplier?: string,
  nativeCryptoAmount?: string,
  appendFiatCurrencyCode?: boolean,
  fiatSymbolSpace?: boolean,
  isoFiatCurrencyCode?: string,
  parenthesisEnclosed?: boolean,
  autoPrecision?: boolean,
  noGrouping?: boolean
}

export const useFiatText = (props: Props) => {
  const {
    cryptoExchangeMultiplier = defaultMultiplier,
    appendFiatCurrencyCode,
    nativeCryptoAmount = cryptoExchangeMultiplier,
    fiatSymbolSpace,
    parenthesisEnclosed,
    cryptoCurrencyCode,
    isoFiatCurrencyCode = USD_FIAT,
    autoPrecision,
    noGrouping = false
  } = props

  // Convert native to fiat amount.
  // Does NOT take into account display denomination settings here,
  // i.e. sats, bits, etc.
  const fiatAmount = useSelector(state => {
    const cryptoAmount = div(nativeCryptoAmount, cryptoExchangeMultiplier, DECIMAL_PRECISION)
    return convertCurrency(state, cryptoCurrencyCode, isoFiatCurrencyCode, cryptoAmount)
  })
  // Convert the amount to an internationalized string
  const formattedFiatString = formatFiatString({
    fiatAmount,
    autoPrecision,
    noGrouping
  })
  // Remove trailing zeros for 'fiatString'
  const fiatString = trimEnd(formattedFiatString)
  // Create FiatText' prefix
  const fiatSymbol = getSymbolFromCurrency(isoFiatCurrencyCode)
  const fiatSymbolFmt = fiatSymbolSpace ? `${fiatSymbol} ` : fiatSymbol
  const prefix = `${parenthesisEnclosed ? '(' : ''}${fiatSymbolFmt} `
  // Create FiatText' suffix
  const fiatCurrencyCode = appendFiatCurrencyCode ? ` ${isoFiatCurrencyCode.replace('iso:', '')}` : ''
  const suffix = `${fiatCurrencyCode}${parenthesisEnclosed ? ')' : ''}`

  const fiatText = `${prefix}${fiatString}${fiatCurrencyCode}${suffix}`
  return { fiatAmount, fiatString, fiatText }
}
