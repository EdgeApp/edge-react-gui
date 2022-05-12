// @flow

import { type EdgeCurrencyWallet } from 'edge-core-js'

import { useFiatText } from '../../hooks/useFiatText'
import { useTokenDisplayData } from '../../hooks/useTokenDisplayData'

type Props = {|
  // Display options:
  appendFiatCurrencyCode?: boolean,
  autoPrecision?: boolean,
  fiatSymbolSpace?: boolean,

  // Amount to show:
  nativeCryptoAmount: string,
  tokenId?: string,
  wallet: EdgeCurrencyWallet,

  // Deprecated. Use `tokenId` instead:
  currencyCode?: string
|}

/**
 * Return a formatted fiat text string representing the exchange rate of a
 * specific crypto asset and native amount.
 **/
export const FiatText = ({ appendFiatCurrencyCode, autoPrecision, currencyCode, fiatSymbolSpace, nativeCryptoAmount, tokenId, wallet }: Props) => {
  const {
    currencyCode: derivedCurrencyCode,
    denomination,
    isoFiatCurrencyCode
  } = useTokenDisplayData({
    tokenId,
    wallet
  })

  return useFiatText({
    appendFiatCurrencyCode,
    autoPrecision,
    cryptoCurrencyCode: currencyCode ?? derivedCurrencyCode,
    cryptoExchangeMultiplier: denomination.multiplier,
    fiatSymbolSpace,
    isoFiatCurrencyCode,
    nativeCryptoAmount
  })
}
