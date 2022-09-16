import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'

import { useFiatText } from '../../hooks/useFiatText'
import { useTokenDisplayData } from '../../hooks/useTokenDisplayData'

type Props = {
  // Display options:
  appendFiatCurrencyCode?: boolean
  autoPrecision?: boolean
  fiatSymbolSpace?: boolean
  hideFiatSymbol?: boolean

  // Amount to show:
  nativeCryptoAmount: string
  tokenId?: string
  wallet: EdgeCurrencyWallet
}

/**
 * Return a formatted fiat text string representing the exchange rate of a
 * specific crypto asset and native amount.
 **/
export const FiatText = ({ appendFiatCurrencyCode, autoPrecision, hideFiatSymbol, fiatSymbolSpace, nativeCryptoAmount, tokenId, wallet }: Props) => {
  const { currencyCode, denomination, isoFiatCurrencyCode } = useTokenDisplayData({
    tokenId,
    wallet
  })

  const text = useFiatText({
    appendFiatCurrencyCode,
    autoPrecision,
    cryptoCurrencyCode: currencyCode,
    cryptoExchangeMultiplier: denomination.multiplier,
    fiatSymbolSpace,
    hideFiatSymbol,
    isoFiatCurrencyCode,
    nativeCryptoAmount
  })
  return <>{text}</>
}
