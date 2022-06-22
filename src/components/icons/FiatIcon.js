// @flow
import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import FastImage from 'react-native-fast-image'

import { getSymbolFromCurrency } from '../../constants/WalletAndCurrencyConstants.js'
import { memo } from '../../types/reactHooks'
import { getCurrencyIconUris } from '../../util/CdnUris'
import { fixSides, mapSides, sidesToMargin } from '../../util/sides.js'
import { fixFiatCurrencyCode } from '../../util/utils.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'

type Props = {
  mono?: boolean, // To use the mono dark icon logo
  fiatCurrencyCode: string, // The currency code to use for the icon image

  // Styling props
  marginRem?: number | number[],
  sizeRem?: number
}

/**
 * Dynamic icon where the wallet's fiat symbol is overlayed on top of a
 * background of a blank green circle icon.
 */
export const FiatIconComponent = (props: Props) => {
  const { marginRem, mono = false, sizeRem = 2, fiatCurrencyCode } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const fiatBackgroundIcon = getCurrencyIconUris('fiat')
  const source = { uri: mono ? fiatBackgroundIcon.symbolImageDarkMono : fiatBackgroundIcon.symbolImage }
  const fiatSymbol = getSymbolFromCurrency(fixFiatCurrencyCode(fiatCurrencyCode))
  const fiatSymbolSizing = { fontSize: theme.rem(sizeRem * 0.625) }

  // Main view styling
  const iconSizing = {
    ...sidesToMargin(mapSides(fixSides(marginRem, 0), theme.rem)),
    height: theme.rem(sizeRem),
    width: theme.rem(sizeRem)
  }

  return (
    <View style={[styles.fiatIcon, iconSizing]}>
      <FastImage style={StyleSheet.absoluteFill} source={source} />
      <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.fiatSymbol, fiatSymbolSizing]}>
        {fiatSymbol}
      </Text>
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  fiatIcon: {
    alignItems: 'center',
    flexDirection: 'row'
  },
  fiatSymbol: {
    textAlign: 'center',
    color: theme.primaryText,
    fontFamily: theme.fontFaceBold,
    paddingHorizontal: theme.rem(0.25),
    width: '100%'
  }
}))

export const FiatIcon = memo(FiatIconComponent)
