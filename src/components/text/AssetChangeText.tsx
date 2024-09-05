import { abs, div, gt, lt, mul, sub } from 'biggystring'
import { EdgeCurrencyWallet, EdgeTokenId } from 'edge-core-js'
import * as React from 'react'
import { TextStyle } from 'react-native'

import { useTokenDisplayData } from '../../hooks/useTokenDisplayData'
import { toPercentString } from '../../locales/intl'
import { Theme } from '../../types/Theme'
import { DECIMAL_PRECISION, zeroString } from '../../util/utils'
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
  const { assetToFiatRate, usdToWalletFiatRate, assetToYestFiatRate } = useTokenDisplayData({
    tokenId,
    wallet
  })

  const theme = useTheme()
  const { percentString, deltaColorStyle } = getPercentDeltaString(assetToFiatRate, assetToYestFiatRate, usdToWalletFiatRate, theme)
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

const getPercentDeltaString = (assetToFiatRate: string, assetToYestFiatRate: string, usdToWalletFiatRate: string, theme: Theme) => {
  const yesterdayExchangeRate = mul(assetToYestFiatRate, usdToWalletFiatRate)
  const yesterdayDelta = sub(assetToFiatRate, yesterdayExchangeRate)

  // Use 0 as delta if either exchange rate is missing or 0
  const yesterdayDeltaPct =
    zeroString(yesterdayExchangeRate) || zeroString(assetToFiatRate) ? '0' : div(yesterdayDelta, yesterdayExchangeRate, DECIMAL_PRECISION)

  let percentString
  // Prepend a < sign if a nonzero delta rounds to zero
  if (!zeroString(yesterdayDeltaPct) && lt(abs(yesterdayDeltaPct), '0.001')) {
    percentString = `<${toPercentString(0.0001, { maxPrecision: 2, intlOpts: { noGrouping: true } })}`
  } else {
    percentString = toPercentString(yesterdayDeltaPct, { maxPrecision: 2, intlOpts: { noGrouping: true } })
  }

  // Colored, signed percentString representing daily price delta. Prepends a '+'
  // symbol to the percent string if > 0, otherwise a "-" if < 0.
  if (gt(yesterdayDeltaPct, '0')) {
    return { percentString: `+${percentString}`, deltaColorStyle: theme.positiveText }
  } else if (lt(yesterdayDeltaPct, '0')) {
    return { percentString: `${percentString}`, deltaColorStyle: theme.negativeDeltaText }
  } else {
    return { percentString, deltaColorStyle: theme.negativeText }
  }
}
