// @flow
import { bns } from 'biggystring'

import { getExchangeDenomination } from '../../selectors/DenominationSelectors'
import { convertCurrency } from '../../selectors/WalletSelectors.js'
import { useSelector } from '../../types/reactRedux.js'
import { DECIMAL_PRECISION, formatFiatString, getFiatSymbol } from '../../util/utils'

type Props = {
  appendFiatCurrencyCode?: boolean,
  nativeCryptoAmount: string,
  cryptoCurrencyCode: string,
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
    noGrouping = false
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
    const exchangeDenomMult = getExchangeDenomination(state, cryptoCurrencyCode).multiplier
    const cryptoAmount = bns.div(nativeCryptoAmount, exchangeDenomMult, DECIMAL_PRECISION)
    return convertCurrency(state, cryptoCurrencyCode, isoFiatCurrencyCode, cryptoAmount)
  })

  return `${openParen}${fiatSymbolFmt} ${formatFiatString({
    fiatAmount,
    autoPrecision,
    noGrouping
  })}${fiatCurrencyCode}${closeParen}`
}
