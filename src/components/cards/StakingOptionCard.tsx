import * as React from 'react'
import { View } from 'react-native'
import FastImage from 'react-native-fast-image'
import { sprintf } from 'sprintf-js'

import { lstrings } from '../../locales/strings'
import { StakeProviderInfo } from '../../plugins/stake-plugins/types'
import { getStakeProviderIcon } from '../../util/CdnUris'
import { PairIcons } from '../icons/PairIcons'
import { Space } from '../layout/Space'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { EdgeCard } from './EdgeCard'

interface StakingOptionCardProps {
  apy?: number
  currencyLogos: string[]
  isStaked: boolean
  primaryText: string
  secondaryText: string
  stakeProviderInfo?: StakeProviderInfo
}

export function StakingOptionCard({ apy, currencyLogos, isStaked, primaryText, secondaryText, stakeProviderInfo }: StakingOptionCardProps) {
  const theme = useTheme()
  const styles = getStyles(theme)

  const aprText: string | undefined = apy != null ? apy.toFixed(2) + '%' : undefined

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
    <Space topRem={1.5}>
      <EdgeCard gradientBackground={isStaked ? theme.cardGradientLearn : undefined}>
        <View style={styles.iconsContainer}>
          <View style={styles.icon}>
            <PairIcons icons={currencyLogos} />
          </View>
        </View>
        <View style={styles.textContainer}>
          <EdgeText style={styles.primaryText}>{primaryText}</EdgeText>
          {renderStakeProvider()}
          <EdgeText style={styles.secondaryText}>{secondaryText}</EdgeText>
          {aprText == null ? null : <EdgeText style={styles.secondaryText}>{sprintf(lstrings.stake_estimated_apr_s, aprText)}</EdgeText>}
        </View>
      </EdgeCard>
    </Space>
  )
}

const getStyles = cacheStyles((theme: Theme) => {
  return {
    iconsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: theme.rem(-1)
    },
    textContainer: {
      alignItems: 'center',
      paddingHorizontal: theme.rem(0.5),
      paddingBottom: theme.rem(0.5)
    },
    icon: {
      top: theme.rem(-2)
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
      height: theme.rem(0.625)
    },
    swapProviderText: {
      fontSize: theme.rem(0.75),
      color: theme.secondaryText
    }
  }
})
