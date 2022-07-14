// @flow

import * as React from 'react'
import { View } from 'react-native'

import { PairIcons } from '../icons/PairIcons.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText'

export function StakingReturnsCard({
  fromCurrencyLogos,
  toCurrencyLogos,
  text
}: {
  fromCurrencyLogos: string[],
  toCurrencyLogos: string[],
  text: string
}): React.Node {
  const styles = getStyles(useTheme())

  const renderArrow = () => {
    return (
      <View style={styles.arrowContainer}>
        <View style={styles.arrowTopLine} />
        <View style={styles.arrowBase} />
        <View style={styles.arrowBottomLine} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.leftCap} />
      <View>
        <View style={styles.iconsContainer}>
          <View style={styles.middleLine} />
          <View style={styles.icon}>
            <PairIcons icons={fromCurrencyLogos} />
            {renderArrow()}
            <PairIcons icons={toCurrencyLogos} />
          </View>
          <View style={styles.middleLine} />
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
  const commonCap = {
    borderColor: theme.lineDivider,
    borderBottomWidth: theme.thinLineWidth,
    borderTopWidth: theme.thinLineWidth,
    width: theme.rem(1)
  }
  const commonArrow = {
    position: 'absolute',
    width: theme.thinLineWidth * 2,
    height: theme.rem(0.625),
    right: 0 + theme.thinLineWidth * 1.5,
    borderRadius: theme.thinLineWidth,
    backgroundColor: theme.icon
  }
  return {
    container: {
      flexDirection: 'row',
      minWidth: theme.rem(10),
      marginTop: theme.rem(1.5)
    },
    iconsContainer: {
      flexDirection: 'row',
      position: 'absolute'
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
    icon: {
      top: theme.rem(-1.5),
      flexDirection: 'row',
      alignItems: 'center'
    },
    middleLine: {
      flex: 1,
      borderTopWidth: theme.thinLineWidth,
      borderColor: theme.lineDivider
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
    },
    arrowContainer: {
      flexDirection: 'row'
    },
    arrowBase: {
      width: theme.rem(3),
      height: theme.thinLineWidth * 2,
      borderRadius: theme.thinLineWidth,
      backgroundColor: theme.icon
    },
    arrowTopLine: {
      ...commonArrow,
      bottom: 0 - theme.thinLineWidth * 1.325,
      transform: [{ rotateZ: '-45deg' }]
    },
    arrowBottomLine: {
      ...commonArrow,
      top: 0 - theme.thinLineWidth * 1.325,
      transform: [{ rotateZ: '45deg' }]
    }
  }
})
