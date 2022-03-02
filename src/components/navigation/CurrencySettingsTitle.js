// @flow

import { type EdgeCurrencyInfo } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'
import FastImage from 'react-native-fast-image'

import { getCurrencyIcon } from '../../util/CurrencyInfoHelpers.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText.js'

type Props = {
  currencyInfo: EdgeCurrencyInfo
}

export function CurrencySettingsTitle(props: Props) {
  const { displayName } = props.currencyInfo
  const { symbolImage } = getCurrencyIcon(props.currencyInfo.pluginId)
  const styles = getStyles(useTheme())
  return (
    <View style={styles.container}>
      <FastImage style={styles.image} source={{ uri: symbolImage }} />
      <EdgeText style={styles.text}>{displayName}</EdgeText>
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.rem(0.75)
  },
  image: {
    height: theme.rem(1.25),
    width: theme.rem(1.25),
    marginRight: theme.rem(0.5),
    resizeMode: 'contain'
  },
  text: {
    fontFamily: theme.fontFaceMedium
  }
}))
