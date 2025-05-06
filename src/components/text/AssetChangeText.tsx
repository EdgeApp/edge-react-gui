import { gt, lt } from 'biggystring'
import { EdgeCurrencyWallet, EdgeTokenId } from 'edge-core-js'
import * as React from 'react'
import { TextStyle } from 'react-native'

import { useTokenDisplayData } from '../../hooks/useTokenDisplayData'
import { toPercentString } from '../../locales/intl'
import { Theme } from '../../types/Theme'
import { useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

interface Props {
  wallet: EdgeCurrencyWallet
  tokenId: EdgeTokenId
  style?: TextStyle
}

/**
 * Returns a styled text node that displays the daily % change from a wallet
 * asset
 **/
export const AssetChangeTextUi4 = React.memo(({ wallet, tokenId, style }: Props) => {
  const { assetToFiatRate, usdToWalletFiatRate, assetToYestUsdRate } = useTokenDisplayData({
    tokenId,
    currencyConfig: wallet.currencyConfig
  })

  const theme = useTheme()
  const { percentString, deltaColorStyle } = getPercentDeltaString(assetToFiatRate, assetToYestUsdRate, usdToWalletFiatRate, theme)
  const textStyle = React.useMemo<TextStyle>(
    () => ({
      color: deltaColorStyle,
      textAlign: 'left',
      flexShrink: 1,
      ...style
    }),
    [deltaColorStyle, style]
  )

  return <EdgeText style={textStyle}>{percentString}</EdgeText>
})

const getPercentDeltaString = (assetToFiatRate: number, assetToYestFiatRate: number, usdToWalletFiatRate: number, theme: Theme) => {
  const yesterdayExchangeRate = assetToYestFiatRate * usdToWalletFiatRate
  const yesterdayDelta = assetToFiatRate - yesterdayExchangeRate

  // Use 0 as delta if either exchange rate is missing or 0
  const yesterdayDeltaPct = yesterdayExchangeRate === 0 || assetToFiatRate === 0 ? 0 : yesterdayDelta / yesterdayExchangeRate

  let percentString
  // Prepend a < sign if a nonzero delta rounds to zero
  if (yesterdayDeltaPct !== 0 && Math.abs(yesterdayDeltaPct) < 0.001) {
    percentString = `<${toPercentString(0.0001, {
      maxPrecision: 2,
      intlOpts: { noGrouping: true }
    })}`
  } else {
    percentString = toPercentString(yesterdayDeltaPct, {
      maxPrecision: 2,
      intlOpts: { noGrouping: true }
    })
  }

  // Colored, signed percentString representing daily price delta. Prepends a '+'
  // symbol to the percent string if > 0, otherwise a "-" if < 0.
  if (gt(yesterdayDeltaPct, '0')) {
    return {
      percentString: `+${percentString}`,
      deltaColorStyle: theme.positiveText
    }
  } else if (lt(yesterdayDeltaPct, '0')) {
    return {
      percentString: `${percentString}`,
      deltaColorStyle: theme.negativeDeltaText
    }
  } else {
    return { percentString, deltaColorStyle: theme.negativeText }
  }
}
