// @flow
import { bns } from 'biggystring'

import { getDisplayDenomination, getExchangeDenomination } from '../../selectors/DenominationSelectors'
import { convertCurrency } from '../../selectors/WalletSelectors.js'
import { useSelector } from '../../types/reactRedux.js'
import { DECIMAL_PRECISION, displayFiatAmount, formatFiatString, getDenomFromIsoCode, getFiatSymbol } from '../../util/utils'

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

type TempProps = {
  appendFiatCurrencyCode?: boolean,
  nativeCryptoAmount: string,
  cryptoCurrencyCode: string,
  fiatSymbolSpace?: boolean,
  isoFiatCurrencyCode: string,
  parenthesisEnclosed?: boolean,
  autoPrecision?: boolean
}

export const FiatTextTemp = (props: TempProps) => {
  const { appendFiatCurrencyCode, nativeCryptoAmount, fiatSymbolSpace, parenthesisEnclosed, cryptoCurrencyCode, isoFiatCurrencyCode, autoPrecision } = props

  // Get conversion rate
  const nativeToFiatAmt = useSelector(state => {
    return convertCurrency(state, cryptoCurrencyCode, isoFiatCurrencyCode, nativeCryptoAmount)
  })

  // Apply multipliers for non-native denominations and fiat precision
  const nativeToDenomMult = useSelector(state => {
    const exchangeDenom = getExchangeDenomination(state, cryptoCurrencyCode).multiplier
    const displayDenom = getDisplayDenomination(state, cryptoCurrencyCode).multiplier
    return bns.div(displayDenom, exchangeDenom, DECIMAL_PRECISION)
  })
  const fiatDenomMult = useSelector(state => getDenomFromIsoCode(isoFiatCurrencyCode).multiplier)

  const fiatAmount = bns.mul(nativeToFiatAmt, nativeToDenomMult)

  return formatFiatString({
    isoFiatCurrencyCode,
    fiatAmount,
    fiatDenomMult,
    appendFiatCurrencyCode,
    autoPrecision,
    fiatSymbolSpace,
    parenthesisEnclosed
  })
}
