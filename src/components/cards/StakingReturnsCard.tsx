import { toFixed } from 'biggystring'
import * as React from 'react'
import { View, ViewStyle } from 'react-native'
import FastImage from 'react-native-fast-image'
import { sprintf } from 'sprintf-js'

import { lstrings } from '../../locales/strings'
import { StakeProviderInfo } from '../../plugins/stake-plugins/types'
import { getStakeProviderIcon } from '../../util/CdnUris'
import { PairIcons } from '../icons/PairIcons'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { EdgeCard } from './EdgeCard'

interface StakingReturnsCardParams {
  fromCurrencyLogos: string[]
  toCurrencyLogos: string[]
  apy?: number
  stakeProviderInfo?: StakeProviderInfo
}

export function StakingReturnsCard({ fromCurrencyLogos, toCurrencyLogos, apy, stakeProviderInfo }: StakingReturnsCardParams) {
  const theme = useTheme()
  const styles = getStyles(theme)

  const renderArrow = () => {
    return (
      <View style={styles.arrowContainer}>
        <View style={styles.arrowTopLine} />
        <View style={styles.arrowBase} />
        <View style={styles.arrowBottomLine} />
      </View>
    )
  }

  const renderEstimatedReturn = () => {
    if (apy == null || apy <= 0) return null
    const estimatedReturnMsg = toFixed(apy.toString(), 1, 1) + '% APR'
    return <EdgeText>{sprintf(lstrings.stake_estimated_return, estimatedReturnMsg)}</EdgeText>
  }

  const renderStakeProvider = () => {
    if (stakeProviderInfo == null) return null
    const { displayName, pluginId, stakeProviderId } = stakeProviderInfo
    const swapProviderIcon = getStakeProviderIcon(pluginId, stakeProviderId, theme)
    return (
      <View style={styles.swapProvider}>
        {swapProviderIcon ? <FastImage style={styles.swapProviderIcon} resizeMode={FastImage.resizeMode.contain} source={{ uri: swapProviderIcon }} /> : null}
        <EdgeText style={styles.swapProviderText}>{displayName}</EdgeText>
      </View>
    )
  }

  return (
    <EdgeCard>
      <View style={styles.iconsContainer}>
        <PairIcons icons={fromCurrencyLogos} />
        {renderArrow()}
        <PairIcons icons={toCurrencyLogos} />
      </View>
      <View style={styles.textContainer}>
        {renderEstimatedReturn()}
        {renderStakeProvider()}
      </View>
    </EdgeCard>
  )
}

const getStyles = cacheStyles((theme: Theme) => {
  const commonArrow: ViewStyle = {
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
      marginVertical: theme.rem(0.5),
      alignItems: 'center',
      justifyContent: 'center'
    },
    textContainer: {
      alignItems: 'center',
      margin: theme.rem(0.5),
      borderColor: theme.lineDivider,
      minWidth: theme.rem(15)
    },
    swapProvider: {
      marginTop: theme.rem(0.25),
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
