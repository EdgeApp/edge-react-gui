// @flow
import { bns } from 'biggystring'

import { getExchangeDenomination } from '../../selectors/DenominationSelectors'
import { convertCurrency } from '../../selectors/WalletSelectors.js'
import { useSelector } from '../../types/reactRedux.js'
import { DECIMAL_PRECISION, formatFiatString } from '../../util/utils'

type Props = {
  appendFiatCurrencyCode?: boolean,
  nativeCryptoAmount: string,
  cryptoCurrencyCode: string,
  fiatSymbolSpace?: boolean,
  isoFiatCurrencyCode: string,
  parenthesisEnclosed?: boolean,
  autoPrecision?: boolean
}

export const FiatText = (props: Props) => {
  const { appendFiatCurrencyCode, nativeCryptoAmount, fiatSymbolSpace, parenthesisEnclosed, cryptoCurrencyCode, isoFiatCurrencyCode, autoPrecision } = props

  // Convert native to fiat amount.
  // Does NOT take into account display denomination settings here,
  // i.e. sats, bits, etc.
  const fiatAmount = useSelector(state => {
    const exchangeDenomMult = getExchangeDenomination(state, cryptoCurrencyCode).multiplier
    const cryptoAmount = bns.div(nativeCryptoAmount, exchangeDenomMult, DECIMAL_PRECISION)
    return convertCurrency(state, cryptoCurrencyCode, isoFiatCurrencyCode, cryptoAmount)
  })

  return formatFiatString({
    isoFiatCurrencyCode,
    fiatAmount,
    appendFiatCurrencyCode,
    autoPrecision,
    fiatSymbolSpace,
    parenthesisEnclosed
  })
}
