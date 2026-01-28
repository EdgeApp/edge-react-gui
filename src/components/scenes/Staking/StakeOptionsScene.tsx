import { gt } from 'biggystring'
import type { EdgeCurrencyWallet, EdgeTokenId } from 'edge-core-js'
import * as React from 'react'
import { FlatList } from 'react-native-gesture-handler'
import { sprintf } from 'sprintf-js'

import { SCROLL_INDICATOR_INSET_FIX } from '../../../constants/constantSettings'
import { useAsyncValue } from '../../../hooks/useAsyncValue'
import { useIconColor } from '../../../hooks/useIconColor'
import { lstrings } from '../../../locales/strings'
import { getStakePlugins } from '../../../plugins/stake-plugins/stakePlugins'
import type { StakePolicy } from '../../../plugins/stake-plugins/types'
import { useSelector } from '../../../types/reactRedux'
import type { EdgeAppSceneProps } from '../../../types/routerTypes'
import { getCurrencyCode } from '../../../util/CurrencyInfoHelpers'
import {
  getPluginFromPolicyId,
  getPoliciesFromPlugins,
  getPolicyAssetName,
  getPolicyIconUris,
  getPolicyTitleName
} from '../../../util/stakeUtils'
import { darkenHexColor } from '../../../util/utils'
import { StakingOptionCard } from '../../cards/StakingOptionCard'
import type { AccentColors } from '../../common/DotsBackground'
import { EdgeTouchableOpacity } from '../../common/EdgeTouchableOpacity'
import { SceneWrapper } from '../../common/SceneWrapper'
import { withWallet } from '../../hoc/withWallet'
import { SceneContainer } from '../../layout/SceneContainer'
import { Space } from '../../layout/Space'
import { useTheme } from '../../services/ThemeContext'
import { EdgeText } from '../../themed/EdgeText'

interface Props extends EdgeAppSceneProps<'stakeOptions'> {
  wallet: EdgeCurrencyWallet
}

export interface StakeOptionsParams {
  tokenId: EdgeTokenId
  walletId: string
}

const StakeOptionsSceneComponent: React.FC<Props> = props => {
  const { navigation, route, wallet } = props
  const { tokenId } = route.params
  const [stakePlugins = []] = useAsyncValue(
    async () => await getStakePlugins(wallet.currencyInfo.pluginId)
  )
  const stakePositionMap = useSelector(
    state => state.staking.walletStakingMap[wallet.id]?.stakePositionMap ?? {}
  )
  const theme = useTheme()

  const account = useSelector(state => state.core.account)
  const countryCode = useSelector(state => state.ui.countryCode)
  const pluginId = wallet?.currencyInfo.pluginId
  const iconColor = useIconColor({ pluginId, tokenId })
  const currencyCode = getCurrencyCode(wallet, tokenId)

  const stakePolicies = getPoliciesFromPlugins(
    stakePlugins,
    stakePositionMap,
    wallet,
    tokenId
  )
  const stakePolicyArray = React.useMemo(
    () => Object.values(stakePolicies),
    [stakePolicies]
  )

  //
  // Handlers
  //

  const handleStakeOptionPress = (stakePolicy: StakePolicy): void => {
    const { stakePolicyId } = stakePolicy
    const stakePlugin = getPluginFromPolicyId(stakePlugins, stakePolicyId, {
      pluginId
    })
    if (stakePlugin != null)
      navigation.push('stakeOverview', {
        stakePlugin,
        walletId: wallet.id,
        stakePolicyId
      })
  }

  //
  // Renders
  //

  const renderOptions = ({
    item: stakePolicy
  }: {
    item: StakePolicy
  }): React.ReactElement => {
    const primaryText = getPolicyAssetName(stakePolicy, 'stakeAssets')
    const secondaryText = getPolicyTitleName(stakePolicy, countryCode)
    const key = [primaryText, secondaryText].join()
    const policyIcons = getPolicyIconUris(account.currencyConfig, stakePolicy)
    const stakePosition = stakePositionMap[stakePolicy.stakePolicyId]
    const isStaked = stakePosition?.allocations.some(
      allocation =>
        allocation.allocationType === 'staked' &&
        gt(allocation.nativeAmount, '0')
    )
    return (
      <EdgeTouchableOpacity
        key={key}
        onPress={() => {
          handleStakeOptionPress(stakePolicy)
        }}
      >
        <StakingOptionCard
          apy={stakePolicy.apy}
          currencyLogos={policyIcons.stakeAssetUris}
          isStaked={isStaked}
          primaryText={primaryText}
          secondaryText={secondaryText}
          stakeProviderInfo={stakePolicy.stakeProviderInfo}
        />
      </EdgeTouchableOpacity>
    )
  }

  const accentColors: AccentColors = {
    // Transparent fallback for while iconColor is loading
    iconAccentColor: iconColor ?? '#00000000'
  }

  const backgroundColors = [...theme.assetBackgroundGradientColors]
  if (iconColor != null && theme.isDark) {
    const scaledColor = darkenHexColor(
      iconColor,
      theme.assetBackgroundColorScale
    )
    backgroundColors[0] = scaledColor
  }

  return (
    <SceneWrapper
      accentColors={accentColors}
      backgroundGradientColors={backgroundColors}
      backgroundGradientEnd={theme.assetBackgroundGradientEnd}
      backgroundGradientStart={theme.assetBackgroundGradientStart}
      overrideDots={theme.backgroundDots.assetOverrideDots}
    >
      {({ undoInsetStyle, insetStyle }) => (
        <SceneContainer
          headerTitle={sprintf(
            lstrings.staking_change_add_header,
            currencyCode
          )}
          undoInsetStyle={undoInsetStyle}
        >
          <FlatList
            data={stakePolicyArray}
            renderItem={renderOptions}
            contentContainerStyle={{ paddingBottom: insetStyle.paddingBottom }}
            ListHeaderComponent={
              <Space horizontalRem={1} bottomRem={0.5}>
                <EdgeText>{lstrings.stake_select_options}</EdgeText>
              </Space>
            }
            keyExtractor={(stakePolicy: StakePolicy) =>
              stakePolicy.stakePolicyId
            }
            scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}
          />
        </SceneContainer>
      )}
    </SceneWrapper>
  )
}

export const StakeOptionsScene = withWallet(StakeOptionsSceneComponent)
