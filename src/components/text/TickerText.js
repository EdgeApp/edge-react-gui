// @flow

import { abs, div, gt, mul, sub } from 'biggystring'
import { type EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { Text } from 'react-native'

import { useFiatText } from '../../hooks/useFiatText'
import { useTokenDisplayData } from '../../hooks/useTokenDisplayData'
import { type Theme } from '../../types/Theme'
import { zeroString } from '../../util/utils'
import { useTheme } from '../services/ThemeContext'

type Props = {|
  wallet: EdgeCurrencyWallet,
  tokenId?: string
|}

const getPercentDeltaString = (currencyCode: string, assetToFiatRate: string, assetToYestFiatRate: string, usdToWalletFiatRate: string, theme: Theme) => {
  const yesterdayExchangeRate = mul(assetToYestFiatRate, usdToWalletFiatRate)

  // Blank string if yesterday's exchange rate does not exist
  if (zeroString(yesterdayExchangeRate)) return { percentString: '', deltaColorStyle: theme.secondaryText }

  const yesterdayDelta = sub(assetToFiatRate, yesterdayExchangeRate)
  const yesterdayDeltaPct = mul(div(yesterdayDelta, yesterdayExchangeRate, 3), '100')

  // Neutral zero for no historical delta
  if (zeroString(yesterdayDeltaPct)) return { percentString: '0.00', deltaColorStyle: theme.secondaryText }

  // Colored, signed percentString representing daily price delta
  const percentString = abs(yesterdayDeltaPct)
  if (gt(yesterdayDeltaPct, '0')) return { percentString: `+${percentString}%`, deltaColorStyle: theme.positiveText }
  return { percentString: `-${percentString}%`, deltaColorStyle: theme.negativeText }
}

/**
 * Returns a text string that displays the crypto-fiat exchange rate and the
 * daily % change from a wallet asset
 **/
export const TickerText = ({ wallet, tokenId }: Props) => {
  const { currencyCode, denomination, isoFiatCurrencyCode, assetToFiatRate, usdToWalletFiatRate, assetToYestFiatRate } = useTokenDisplayData({
    tokenId,
    wallet
  })

  const fiatText = useFiatText({
    autoPrecision: true,
    cryptoCurrencyCode: currencyCode,
    cryptoExchangeMultiplier: denomination.multiplier,
    fiatSymbolSpace: true,
    isoFiatCurrencyCode,
    nativeCryptoAmount: denomination.multiplier
  })

  const theme = useTheme()
  const { percentString, deltaColorStyle } = getPercentDeltaString(currencyCode, assetToFiatRate, assetToYestFiatRate, usdToWalletFiatRate, theme)

  const tickerText = `${fiatText} ${percentString}`
  return <Text style={{ color: deltaColorStyle }}>{tickerText}</Text>
}
