// @flow
import { div, toFixed } from 'biggystring'

import { convertCurrency } from '../../selectors/WalletSelectors.js'
import { useSelector } from '../../types/reactRedux.js'
import { DECIMAL_PRECISION, formatFiatString, getFiatSymbol } from '../../util/utils'

type Props = {
  appendFiatCurrencyCode?: boolean,
  nativeCryptoAmount: string,
  cryptoCurrencyCode: string,
  cryptoExchangeMultiplier: string,
  fiatSymbolSpace?: boolean,
  isoFiatCurrencyCode: string,
  parenthesisEnclosed?: boolean,
  autoPrecision?: boolean,
  noGrouping?: boolean
}

export const FiatText = (props: Props) => {
  const {
    appendFiatCurrencyCode,
    nativeCryptoAmount,
    fiatSymbolSpace,
    parenthesisEnclosed,
    cryptoCurrencyCode,
    isoFiatCurrencyCode,
    autoPrecision,
    noGrouping = false,
    cryptoExchangeMultiplier
  } = props
  const fiatCurrencyCode = appendFiatCurrencyCode ? ` ${isoFiatCurrencyCode.replace('iso:', '')}` : ''
  const fiatSymbol = getFiatSymbol(isoFiatCurrencyCode)
  const fiatSymbolFmt = fiatSymbolSpace ? `${fiatSymbol} ` : fiatSymbol
  const openParen = parenthesisEnclosed ? '(' : ''
  const closeParen = parenthesisEnclosed ? ')' : ''

  // Convert native to fiat amount.
  // Does NOT take into account display denomination settings here,
  // i.e. sats, bits, etc.
  const fiatAmount = useSelector(state => {
    const cryptoAmount = div(nativeCryptoAmount, cryptoExchangeMultiplier, DECIMAL_PRECISION)
    return convertCurrency(state, cryptoCurrencyCode, isoFiatCurrencyCode, cryptoAmount)
  })

  const formatedFiatString = formatFiatString({
    fiatAmount,
    autoPrecision,
    noGrouping
  })

  // Remove trailing zeros for 'fiatString'
  const fiatAmountString = toFixed(formatedFiatString, 0, 2)

  return `${openParen}${fiatSymbolFmt} ${fiatAmountString}${fiatCurrencyCode}${closeParen}`
}
