import { EdgeTokenId } from 'edge-core-js'
import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import { ShadowedView } from 'react-native-fast-shadow'

import { SPECIAL_CURRENCY_INFO } from '../../constants/WalletAndCurrencyConstants'
import { getCurrencyIconUris } from '../../util/CdnUris'
import { fixSides, mapSides, sidesToMargin } from '../../util/sides'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'

export interface CryptoIconProps {
  // Main props - If non is specified, would just render an empty view
  pluginId: string
  tokenId: EdgeTokenId // Needed when it's a token (not the plugin's native currency)

  // Image props
  hideSecondary?: boolean // Only show the currency icon for token (no secondary icon for the network)
  mono?: boolean // To use the mono dark icon logo
  secondaryCurrencyIconProp?: number | { uri: string }

  // Styling props
  marginRem?: number | number[]
  sizeRem?: number
}

export const CryptoIcon = (props: CryptoIconProps) => {
  const { hideSecondary = false, marginRem, mono = false, secondaryCurrencyIconProp, sizeRem = 2, tokenId } = props

  const theme = useTheme()
  const styles = getStyles(theme)
  const size = theme.rem(sizeRem)

  const { pluginId } = props
  const useChainIcon = SPECIAL_CURRENCY_INFO[pluginId]?.chainIcon ?? false

  // Primary Currency icon
  const icon = getCurrencyIconUris(pluginId, tokenId, useChainIcon)
  const primaryCurrencyIconUrl = mono ? icon.symbolImageDarkMono : icon.symbolImage
  const primaryCurrencyIcon = { uri: primaryCurrencyIconUrl }

  // Secondary (parent) currency icon (if it's a token)
  let secondaryCurrencyIcon = secondaryCurrencyIconProp
  if (tokenId != null && useChainIcon) {
    const icon = getCurrencyIconUris(pluginId, null)
    secondaryCurrencyIcon = { uri: mono ? icon.symbolImageDarkMono : icon.symbolImage }
  }

  // Main view styling
  const spacingStyle = React.useMemo(
    () => ({
      ...sidesToMargin(mapSides(fixSides(marginRem, 0), theme.rem)),
      height: size,
      width: size
    }),
    [marginRem, size, theme]
  )

  const shadowStyle = React.useMemo(
    () => ({
      height: size,
      width: size,
      borderRadius: size / 2,
      backgroundColor: theme.iconShadow.shadowColor,
      ...theme.iconShadow
    }),
    [size, theme]
  )

  return (
    <View style={spacingStyle}>
      <ShadowedView style={shadowStyle}>
        {primaryCurrencyIcon != null ? <FastImage style={StyleSheet.absoluteFill} source={primaryCurrencyIcon} /> : null}
        {hideSecondary ? null : secondaryCurrencyIcon != null ? <FastImage style={styles.parentIcon} source={secondaryCurrencyIcon} /> : null}
      </ShadowedView>
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  parentIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: '50%',
    height: '50%'
  }
}))
