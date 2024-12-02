import { EdgeCurrencyInfo } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'
import { sprintf } from 'sprintf-js'

import { toPercentString } from '../../locales/intl'
import { lstrings } from '../../locales/strings'
import { StakePolicy } from '../../plugins/stake-plugins/types'
import { getPolicyIconUris } from '../../util/stakeUtils'
import { getUkCompliantString } from '../../util/ukComplianceUtils'
import { PairIcons } from '../icons/PairIcons'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { TitleText } from '../text/TitleText'
import { EdgeText } from '../themed/EdgeText'
import { EdgeCard } from './EdgeCard'

interface Props {
  currencyInfo: EdgeCurrencyInfo
  stakePolicy: StakePolicy

  countryCode?: string
  /** If false, show "Stake"/"Earn"
   * If true, show "Staked"/"Earned" */
  isOpenPosition?: boolean
  onPress?: () => void
}

export function EarnOptionCard(props: Props) {
  const theme = useTheme()
  const styles = getStyles(theme)

  const { stakePolicy, currencyInfo, isOpenPosition, countryCode, onPress } = props
  const { apy, yieldType, stakeProviderInfo } = stakePolicy

  const { stakeAssets, rewardAssets } = stakePolicy
  const stakeCurrencyCodes = stakeAssets.map(asset => asset.displayName ?? asset.currencyCode).join(' + ')
  const rewardCurrencyCodes = rewardAssets.map(asset => asset.displayName ?? asset.currencyCode).join(', ')

  const stakeText = sprintf(isOpenPosition ? lstrings.stake_staked_1s : lstrings.stake_stake_1s, stakeCurrencyCodes)
  const rewardText = isOpenPosition
    ? sprintf(lstrings.stake_earning_1s, rewardCurrencyCodes)
    : getUkCompliantString(countryCode, 'stake_earn_1s', rewardCurrencyCodes)

  const policyIcons = getPolicyIconUris(currencyInfo, stakePolicy)

  let apyText: string = yieldType === 'variable' ? lstrings.stake_variable_apy : lstrings.stake_stable_apy

  // Fill in the actual numeric apy values, if they exist
  if (apy != null && apy > 0) {
    const variablePrefix = yieldType === 'stable' ? '' : '~ '
    apyText = variablePrefix + sprintf(lstrings.stake_apy_1s, toPercentString(apy / 100))
  }

  return (
    <EdgeCard onPress={onPress}>
      <View style={styles.contentContainer}>
        <View style={styles.textContainer}>
          <TitleText>{stakeText}</TitleText>
          <EdgeText style={styles.rewardText}>{rewardText}</EdgeText>
          <EdgeText style={styles.apyText}>{apyText}</EdgeText>
          <EdgeText style={styles.providerText} numberOfLines={1}>{`${lstrings.plugin_powered_by_space}${stakeProviderInfo.displayName}`}</EdgeText>
        </View>

        <PairIcons icons={policyIcons.stakeAssetUris} />
      </View>
    </EdgeCard>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  textContainer: {
    flexGrow: 1,
    flexShrink: 1,
    justifyContent: 'center',
    padding: theme.rem(0.5)
  },
  rewardText: {
    fontSize: theme.rem(0.8),
    marginTop: theme.rem(1),
    marginBottom: theme.rem(0.15)
  },
  apyText: {
    fontSize: theme.rem(0.8),
    color: theme.positiveText,
    marginVertical: theme.rem(0.15)
  },
  providerIcon: {
    width: theme.rem(1),
    height: theme.rem(1),
    marginRight: theme.rem(0.25)
  },
  providerText: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  }
}))
