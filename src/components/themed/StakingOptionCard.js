// @flow

import * as React from 'react'
import { View } from 'react-native'
import FastImage from 'react-native-fast-image'

import { type LiquidityPool } from '../../plugins/stake-plugins/types'
import { getLiquidityPoolIconUri } from '../../util/CdnUris.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { EdgeText } from './EdgeText.js'
import { PairIcons } from './PairIcons.js'

export function StakingOptionCard({
  currencyLogos,
  primaryText,
  secondaryText,
  liquidityPool
}: {
  currencyLogos: string[],
  primaryText: string,
  secondaryText: string,
  liquidityPool?: LiquidityPool
}): React.Node {
  const theme = useTheme()
  const styles = getStyles(theme)

  const renderExchangeProvider = () => {
    if (liquidityPool == null) return null
    const { pluginId, lpId } = liquidityPool
    const swapProviderIcon = getLiquidityPoolIconUri(pluginId, lpId, theme)
    return (
      <View style={styles.swapProvider}>
        {swapProviderIcon ? <FastImage style={styles.swapProviderIcon} resizeMode={FastImage.resizeMode.contain} source={{ uri: swapProviderIcon }} /> : null}
        <EdgeText style={styles.swapProviderText}>{liquidityPool.displayName}</EdgeText>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.leftCap} />
      <View style={styles.center}>
        <View style={styles.iconsContainer}>
          <View style={styles.middleLine} />
          <View style={styles.icon}>
            <PairIcons icons={currencyLogos} />
          </View>
          <View style={styles.middleLine} />
        </View>
        <View style={styles.textContainer}>
          <EdgeText style={styles.primaryText}>{primaryText}</EdgeText>
          {renderExchangeProvider()}
          <EdgeText style={styles.secondaryText}>{secondaryText}</EdgeText>
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
      top: theme.rem(-1.5)
    },
    middleLine: {
      flex: 1,
      borderTopWidth: theme.thinLineWidth,
      borderColor: theme.lineDivider
    },
    center: {
      flex: 1
    },
    leftCap: {
      ...commonCap,
      borderLeftWidth: theme.thinLineWidth,
      borderRightWidth: 0,
      borderBottomLeftRadius: theme.rem(0.2),
      borderTopLeftRadius: theme.rem(0.2)
    },
    rightCap: {
      ...commonCap,
      borderLeftWidth: 0,
      borderRightWidth: theme.thinLineWidth,
      borderBottomRightRadius: theme.rem(0.2),
      borderTopRightRadius: theme.rem(0.2)
    },
    primaryText: {
      marginBottom: theme.rem(0.5)
    },
    secondaryText: {
      marginTop: theme.rem(0.5),
      fontSize: theme.rem(0.75)
    },
    swapProvider: {
      flexDirection: 'row',
      alignItems: 'center'
    },
    swapProviderIcon: {
      width: theme.rem(0.625),
      height: theme.rem(0.625),
      marginRight: theme.rem(0.5)
    },
    swapProviderText: {
      fontSize: theme.rem(0.75),
      color: theme.secondaryText
    }
  }
})
