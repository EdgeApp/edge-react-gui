// @flow

import { type EdgeCurrencyInfo } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'

import { CryptoIcon } from '../icons/CryptoIcon.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText.js'

type Props = {
  currencyInfo: EdgeCurrencyInfo
}

export function CurrencySettingsTitle(props: Props) {
  const { displayName, pluginId } = props.currencyInfo

  const styles = getStyles(useTheme())
  return (
    <View style={styles.container}>
      <CryptoIcon marginRem={[0, 0.5, 0, 0]} pluginId={pluginId} sizeRem={1.25} />
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
  text: {
    fontFamily: theme.fontFaceMedium
  }
}))
