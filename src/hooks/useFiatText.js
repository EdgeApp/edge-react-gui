// @flow
import { div, toFixed } from 'biggystring'

import { USD_FIAT } from '../constants/WalletAndCurrencyConstants.js'
import { convertCurrency } from '../selectors/WalletSelectors.js'
import { useState } from '../types/reactHooks.js'
import { useSelector } from '../types/reactRedux.js'
import { DECIMAL_PRECISION, formatFiatString, getFiatSymbol } from '../util/utils'

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

  const [fiatCode, setFiatCode] = useState(isoFiatCurrencyCode)

  const [cryptoCode, setCryptoCode] = useState(cryptoCurrencyCode)

  // Convert native to fiat amount.
  // Does NOT take into account display denomination settings here,
  // i.e. sats, bits, etc.
  const fiatAmount = useSelector(state => {
    const cryptoAmount = div(nativeCryptoAmount, cryptoExchangeMultiplier, DECIMAL_PRECISION)
    return convertCurrency(state, cryptoCode, fiatCode, cryptoAmount)
  })
  const formatedFiatString = formatFiatString({
    fiatAmount,
    autoPrecision,
    noGrouping
  })
  // Remove trailing zeros for 'fiatString'
  const fiatString = toFixed(formatedFiatString, 0, 2)
  // Create FiatText' prefix
  const fiatSymbol = getFiatSymbol(fiatCode)
  const fiatSymbolFmt = fiatSymbolSpace ? `${fiatSymbol} ` : fiatSymbol
  const prefix = `${parenthesisEnclosed ? '(' : ''}${fiatSymbolFmt}`
  // Create FiatText' suffix
  const fiatCurrencyCode = appendFiatCurrencyCode ? ` ${fiatCode.replace('iso:', '')}` : ''
  const suffix = `${fiatCurrencyCode}${parenthesisEnclosed ? ')' : ''}`

  const fiatText = `${prefix} ${fiatString}${fiatCurrencyCode}${suffix}`
  return [{ fiatAmount, fiatString, fiatText }, setFiatCode, setCryptoCode]
}
