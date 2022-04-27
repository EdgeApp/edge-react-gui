// @flow
import { div } from 'biggystring'

import { getSymbolFromCurrency } from '../../../constants/WalletAndCurrencyConstants'
import { convertCurrency } from '../../../selectors/WalletSelectors'
import { useSelector } from '../../../types/reactRedux'
import { DECIMAL_PRECISION, formatFiatString } from '../../../util/utils'

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
  const fiatSymbol = getSymbolFromCurrency(isoFiatCurrencyCode)
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

  return `${openParen}${fiatSymbolFmt} ${formatFiatString({
    fiatAmount,
    autoPrecision,
    noGrouping
  })}${fiatCurrencyCode}${closeParen}`
}
