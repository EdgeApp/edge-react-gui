import type { EdgeCurrencyConfig, EdgeTokenId } from 'edge-core-js'
import * as React from 'react'
import type { TextStyle } from 'react-native'

import { useFiatText } from '../../hooks/useFiatText'
import { useTokenDisplayData } from '../../hooks/useTokenDisplayData'
import { isKeysOnlyPlugin } from '../../util/CurrencyInfoHelpers'
import { EdgeText } from '../themed/EdgeText'

interface Props {
  // Display options:
  appendFiatCurrencyCode?: boolean
  autoPrecision?: boolean
  fiatSymbolSpace?: boolean
  hideFiatSymbol?: boolean
  maxPrecision?: number
  minPrecision?: number
  subCentTruncation?: boolean
  hideBalance?: boolean

  // Style for the wrapping EdgeText
  style?: TextStyle

  // Amount to show:
  nativeCryptoAmount: string
  tokenId: EdgeTokenId
  currencyConfig: EdgeCurrencyConfig
}

/**
 * Return an `<EdgeText>` with the formatted fiat text string representing the
 * exchange rate of a specific crypto asset and native amount.
 *
 * If a raw string is needed, use `useFiatText` instead.
 **/
export const FiatText: React.FC<Props> = ({
  appendFiatCurrencyCode,
  autoPrecision,
  fiatSymbolSpace,
  hideFiatSymbol,
  maxPrecision,
  minPrecision,
  nativeCryptoAmount,
  subCentTruncation = false,
  hideBalance = false,
  tokenId,
  currencyConfig,
  style
}: Props) => {
  const { denomination, isoFiatCurrencyCode } = useTokenDisplayData({
    tokenId,
    currencyConfig
  })

  const text = useFiatText({
    appendFiatCurrencyCode,
    autoPrecision,
    pluginId: currencyConfig.currencyInfo.pluginId,
    tokenId,
    cryptoExchangeMultiplier: denomination.multiplier,
    fiatSymbolSpace,
    hideFiatSymbol,
    isoFiatCurrencyCode,
    maxPrecision,
    minPrecision,
    nativeCryptoAmount: isKeysOnlyPlugin(currencyConfig.currencyInfo.pluginId)
      ? '0'
      : nativeCryptoAmount,
    subCentTruncation,
    hideBalance
  })
  return <EdgeText style={style}>{text}</EdgeText>
}
