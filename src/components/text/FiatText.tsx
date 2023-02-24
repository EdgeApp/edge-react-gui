import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'

import { useFiatText } from '../../hooks/useFiatText'
import { useTokenDisplayData } from '../../hooks/useTokenDisplayData'

interface Props {
  // Display options:
  appendFiatCurrencyCode?: boolean
  autoPrecision?: boolean
  fiatSymbolSpace?: boolean
  hideFiatSymbol?: boolean
  maxPrecision?: number
  minPrecision?: number
  subCentTruncation?: boolean

  // Amount to show:
  nativeCryptoAmount: string
  tokenId?: string
  wallet: EdgeCurrencyWallet
}

/**
 * Return a formatted fiat text string representing the exchange rate of a
 * specific crypto asset and native amount.
 **/
export const FiatText = ({
  appendFiatCurrencyCode,
  autoPrecision,
  fiatSymbolSpace,
  hideFiatSymbol,
  maxPrecision,
  minPrecision,
  nativeCryptoAmount,
  subCentTruncation = false,
  tokenId,
  wallet
}: Props) => {
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
    maxPrecision,
    minPrecision,
    nativeCryptoAmount,
    subCentTruncation
  })
  return <>{text}</>
}
