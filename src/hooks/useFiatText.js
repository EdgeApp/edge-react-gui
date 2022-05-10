// @flow
import { div } from 'biggystring'

import { getSymbolFromCurrency, USD_FIAT } from '../constants/WalletAndCurrencyConstants.js'
import { convertCurrency } from '../selectors/WalletSelectors.js'
import { useSelector } from '../types/reactRedux.js'
import { DECIMAL_PRECISION, formatFiatString, zeroString } from '../util/utils'

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
