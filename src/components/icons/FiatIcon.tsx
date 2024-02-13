import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import FastImage from 'react-native-fast-image'

import { getSymbolFromCurrency } from '../../constants/WalletAndCurrencyConstants'
import { getCurrencyIconUris } from '../../util/CdnUris'
import { fixSides, mapSides, sidesToMargin } from '../../util/sides'
import { fixFiatCurrencyCode } from '../../util/utils'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'

interface Props {
  mono?: boolean // To use the mono dark icon logo
  fiatCurrencyCode: string // The currency code to use for the icon image

  // Styling props
  marginRem?: number | number[]
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

  const fiatBackgroundIcon = getCurrencyIconUris('fiat', null)
  const source = React.useMemo(
    () => ({ uri: mono ? fiatBackgroundIcon.symbolImageDarkMono : fiatBackgroundIcon.symbolImage }),
    [fiatBackgroundIcon.symbolImage, fiatBackgroundIcon.symbolImageDarkMono, mono]
  )
  const fiatSymbol = getSymbolFromCurrency(fixFiatCurrencyCode(fiatCurrencyCode))

  // Main view styling
  const viewStyle = React.useMemo(() => {
    return [
      styles.fiatIcon,
      {
        ...sidesToMargin(mapSides(fixSides(marginRem, 0), theme.rem)),
        height: theme.rem(sizeRem),
        width: theme.rem(sizeRem)
      }
    ]
  }, [marginRem, sizeRem, styles.fiatIcon, theme])

  const textStyle = React.useMemo(() => {
    const fiatSymbolSizing = { fontSize: theme.rem(sizeRem * 0.625) }

    return [styles.fiatSymbol, fiatSymbolSizing]
  }, [sizeRem, styles.fiatSymbol, theme])

  return (
    <View style={viewStyle}>
      <FastImage style={StyleSheet.absoluteFill} source={source} />
      <Text numberOfLines={1} adjustsFontSizeToFit style={textStyle}>
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

export const FiatIcon = React.memo(FiatIconComponent)
