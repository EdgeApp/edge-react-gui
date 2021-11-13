// @flow
import { bns } from 'biggystring'

import { getExchangeDenomination } from '../../selectors/DenominationSelectors'
import { convertCurrency } from '../../selectors/WalletSelectors.js'
import { useSelector } from '../../types/reactRedux.js'
import { DECIMAL_PRECISION, displayFiatAmount, getFiatSymbol } from '../../util/utils.js'

type Props = {
  appendFiatCurrencyCode?: boolean,
  nativeCryptoAmount: string,
  cryptoCurrencyCode: string,
  fiatSymbolSpace?: boolean,
  isoFiatCurrencyCode: string,
  parenthesisEnclosed?: boolean
}

export const FiatText = (props: Props) => {
  const { appendFiatCurrencyCode, fiatSymbolSpace, isoFiatCurrencyCode, parenthesisEnclosed } = props
  const fiatAmountStr = useSelector(state => {
    const { cryptoCurrencyCode, isoFiatCurrencyCode, nativeCryptoAmount } = props
    const cryptoMultiplier = getExchangeDenomination(state, cryptoCurrencyCode).multiplier
    return convertCurrency(state, cryptoCurrencyCode, isoFiatCurrencyCode, bns.div(nativeCryptoAmount, cryptoMultiplier, DECIMAL_PRECISION))
  })

  const fiatCurrencyCode = appendFiatCurrencyCode ? ` ${isoFiatCurrencyCode.replace('iso:', '')}` : ''
  const fiatSymbol = getFiatSymbol(isoFiatCurrencyCode)
  const fiatSymbolFmt = fiatSymbolSpace ? ` ${fiatSymbol}` : fiatSymbol
  const fiatAmountFmtStr = displayFiatAmount(parseFloat(fiatAmountStr.replace(',', '.')))
  const openParen = parenthesisEnclosed ? '(' : ''
  const closeParen = parenthesisEnclosed ? ')' : ''

  return `${openParen}${fiatSymbolFmt}${fiatAmountFmtStr}${fiatCurrencyCode}${closeParen}`
}
