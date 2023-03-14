import { abs, div, gt, mul, sub } from 'biggystring'
import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { TextStyle } from 'react-native'

import { useFiatText } from '../../hooks/useFiatText'
import { useTokenDisplayData } from '../../hooks/useTokenDisplayData'
import { toPercentString } from '../../locales/intl'
import { Theme } from '../../types/Theme'
import { zeroString } from '../../util/utils'
import { useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

interface Props {
  wallet: EdgeCurrencyWallet
  tokenId?: string
}

const getPercentDeltaString = (currencyCode: string, assetToFiatRate: string, assetToYestFiatRate: string, usdToWalletFiatRate: string, theme: Theme) => {
  const yesterdayExchangeRate = mul(assetToYestFiatRate, usdToWalletFiatRate)
  const yesterdayDelta = sub(assetToFiatRate, yesterdayExchangeRate)
  // Avoid divide by zero if there's no exchange rate from yesterday
  const yesterdayDeltaPct = zeroString(yesterdayExchangeRate) ? '0' : div(yesterdayDelta, yesterdayExchangeRate, 3)

  // Blank string if yesterday's exchange rate does not exist or delta percent is close enough to 0 (rounding)
  if (zeroString(yesterdayExchangeRate) || zeroString(yesterdayDeltaPct)) return { percentString: '', deltaColorStyle: theme.secondaryText }

  // Colored, signed percentString representing daily price delta. Prepends a '+'
  // symbol to the percent string if > 0, otherwise a "-" if < 0.
  const percentString = toPercentString(abs(yesterdayDeltaPct), { noGrouping: true })
  if (gt(yesterdayDeltaPct, '0')) return { percentString: `+${percentString}`, deltaColorStyle: theme.positiveText }
  return { percentString: `-${percentString}`, deltaColorStyle: theme.negativeText }
}

/**
 * Returns a text string that displays the crypto-fiat exchange rate and the
 * daily % change from a wallet asset
 **/
export const TickerText = React.memo(({ wallet, tokenId }: Props) => {
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
  const style = React.useMemo<TextStyle>(
    () => ({
      color: deltaColorStyle,
      textAlign: 'left',
      flexShrink: 1,
      marginLeft: theme.rem(0.75),
      alignSelf: 'center'
    }),
    [deltaColorStyle, theme]
  )

  const tickerText = `${fiatText} ${percentString}`
  return <EdgeText style={style}>{tickerText}</EdgeText>
})
