// @flow
import { div } from 'biggystring'

import { getSymbolFromCurrency, USD_FIAT } from '../constants/WalletAndCurrencyConstants.js'
import { convertCurrency } from '../selectors/WalletSelectors.js'
import { useSelector } from '../types/reactRedux.js'
import { DECIMAL_PRECISION, formatFiatString, zeroString } from '../util/utils'

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
  // Convert the amount to an internationalized string or '0'
  const fiatString =
    autoPrecision || !zeroString(fiatAmount)
      ? formatFiatString({
          fiatAmount,
          autoPrecision,
          noGrouping
        })
      : '0'

  // Create FiatText' prefix
  const fiatSymbol = getSymbolFromCurrency(isoFiatCurrencyCode)
  const prefix = `${parenthesisEnclosed ? '(' : ''}${fiatSymbol} `
  // Create FiatText' suffix
  const fiatCurrencyCode = appendFiatCurrencyCode ? ` ${isoFiatCurrencyCode.replace('iso:', '')}` : ''
  const suffix = `${fiatCurrencyCode}${parenthesisEnclosed ? ')' : ''}`

  const fiatText = `${prefix}${fiatString}${fiatCurrencyCode}${suffix}`
  return { fiatAmount, fiatString, fiatText }
}
