// @flow

import * as React from 'react'
import { View } from 'react-native'

import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { EdgeText } from './EdgeText.js'
import { PairIcons } from './PairIcons.js'

export function StakingReturnsCard({ fromCurrencyLogos, text }: { fromCurrencyLogos: string[], text: string }): React.Node {
  const styles = getStyles(useTheme())

  return (
    <View style={styles.container}>
      <View style={styles.leftCap} />
      <View>
        <View style={styles.iconsContainer}>
          <View style={styles.leftIconsLine} />
          <PairIcons icons={fromCurrencyLogos} />
          <View style={styles.rightIconsLine} />
        </View>
        <View style={styles.textContainer}>
          <EdgeText>{text}</EdgeText>
        </View>
      </View>
      <View style={styles.rightCap} />
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => {
  const commonLine = {
    flex: 1,
    borderBottomWidth: theme.thinLineWidth,
    borderBottomColor: theme.lineDivider
  }
  const commonCap = {
    borderColor: theme.lineDivider,
    borderBottomWidth: theme.thinLineWidth,
    borderTopWidth: theme.thinLineWidth,
    width: theme.rem(1)
  }
  return {
    container: {
      flexDirection: 'row',
      minWidth: theme.rem(10)
    },
    iconsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      position: 'absolute',
      bottom: theme.rem(2.75) + 2 * theme.thinLineWidth
    },
    textContainer: {
      alignItems: 'center',
      paddingHorizontal: theme.rem(1),
      paddingTop: theme.rem(2),
      paddingBottom: theme.rem(1),
      borderBottomWidth: theme.thinLineWidth,
      borderColor: theme.lineDivider,
      minWidth: theme.rem(15)
    },
    leftIconsLine: {
      ...commonLine,
      marginRight: theme.rem(0.5)
    },
    rightIconsLine: {
      ...commonLine,
      marginLeft: theme.rem(0.5)
    },
    leftCap: {
      ...commonCap,
      borderLeftWidth: theme.thinLineWidth,
      borderRightWidth: 0,
      borderBottomLeftRadius: theme.rem(0.5),
      borderTopLeftRadius: theme.rem(0.5)
    },
    rightCap: {
      ...commonCap,
      borderLeftWidth: 0,
      borderRightWidth: theme.thinLineWidth,
      borderBottomRightRadius: theme.rem(0.5),
      borderTopRightRadius: theme.rem(0.5)
    }
  }
})
