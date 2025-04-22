import { gt } from 'biggystring'
import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { FlatList } from 'react-native-gesture-handler'
import { sprintf } from 'sprintf-js'

import { SCROLL_INDICATOR_INSET_FIX } from '../../../constants/constantSettings'
import { useAsyncValue } from '../../../hooks/useAsyncValue'
import { useIconColor } from '../../../hooks/useIconColor'
import { lstrings } from '../../../locales/strings'
import { getStakePlugins } from '../../../plugins/stake-plugins/stakePlugins'
import { StakePolicy } from '../../../plugins/stake-plugins/types'
import { useSelector } from '../../../types/reactRedux'
import { EdgeAppSceneProps } from '../../../types/routerTypes'
import { getTokenIdForced } from '../../../util/CurrencyInfoHelpers'
import { getPluginFromPolicyId, getPolicyAssetName, getPolicyIconUris, getPolicyTitleName } from '../../../util/stakeUtils'
import { darkenHexColor } from '../../../util/utils'
import { StakingOptionCard } from '../../cards/StakingOptionCard'
import { AccentColors } from '../../common/DotsBackground'
import { EdgeTouchableOpacity } from '../../common/EdgeTouchableOpacity'
import { SceneWrapper } from '../../common/SceneWrapper'
import { withWallet } from '../../hoc/withWallet'
import { SceneContainer } from '../../layout/SceneContainer'
import { Space } from '../../layout/Space'
import { useTheme } from '../../services/ThemeContext'
import { EdgeText } from '../../themed/EdgeText'
import { SceneHeaderUi4 } from '../../themed/SceneHeaderUi4'

interface Props extends EdgeAppSceneProps<'stakeOptions'> {
  wallet: EdgeCurrencyWallet
}

export interface StakeOptionsParams {
  currencyCode: string
  walletId: string
}

const StakeOptionsSceneComponent = (props: Props) => {
  const { navigation, route, wallet } = props
  const { currencyCode } = route.params
  const [stakePlugins = []] = useAsyncValue(async () => await getStakePlugins(wallet.currencyInfo.pluginId))
  const stakePolicies = stakePlugins.flatMap(stakePlugin =>
    stakePlugin
      .getPolicies({ pluginId })
      .filter(
        stakePolicy =>
          !stakePolicy.deprecated &&
          stakePolicy.stakeAssets.some(asset => asset.pluginId === wallet.currencyInfo.pluginId && asset.currencyCode === currencyCode)
      )
  )
  const stakePositionMap = useSelector(state => state.staking.walletStakingMap[wallet.id]?.stakePositionMap ?? {})
  const theme = useTheme()

  const account = useSelector(state => state.core.account)
  const countryCode = useSelector(state => state.ui.countryCode)
  const pluginId = wallet?.currencyInfo.pluginId
  const tokenId = pluginId ? getTokenIdForced(account, pluginId, currencyCode) : null
  const iconColor = useIconColor({ pluginId, tokenId })

  const stakePolicyArray = React.useMemo(() => Object.values(stakePolicies), [stakePolicies])

  //
  // Handlers
  //

  const handleStakeOptionPress = (stakePolicy: StakePolicy) => {
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

  const renderOptions = ({ item: stakePolicy }: { item: StakePolicy }) => {
    const primaryText = getPolicyAssetName(stakePolicy, 'stakeAssets')
    const secondaryText = getPolicyTitleName(stakePolicy, countryCode)
    const key = [primaryText, secondaryText].join()
    const policyIcons = getPolicyIconUris(wallet.currencyInfo, stakePolicy)
    const stakePosition = stakePositionMap[stakePolicy.stakePolicyId]
    const isStaked = stakePosition?.allocations.some(allocation => allocation.allocationType === 'staked' && gt(allocation.nativeAmount, '0'))
    return (
      <EdgeTouchableOpacity key={key} onPress={() => handleStakeOptionPress(stakePolicy)}>
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
  if (iconColor != null) {
    const scaledColor = darkenHexColor(iconColor, theme.assetBackgroundColorScale)
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
        <SceneContainer undoBottom undoInsetStyle={undoInsetStyle}>
          <FlatList
            data={stakePolicyArray}
            renderItem={renderOptions}
            contentContainerStyle={{ paddingBottom: insetStyle.paddingBottom }}
            ListHeaderComponent={
              <>
                {/* TODO: Decide if our design language accepts scene headers within
                the scroll area of a scene. If so, we must make the SceneContainer
                component implement FlatList components. This is a one-off 
                until then. */}
                <SceneHeaderUi4 title={sprintf(lstrings.staking_change_add_header, currencyCode)} />
                <Space horizontalRem={0.5} bottomRem={0.5}>
                  <EdgeText>{lstrings.stake_select_options}</EdgeText>
                </Space>
              </>
            }
            keyExtractor={(stakePolicy: StakePolicy) => stakePolicy.stakePolicyId}
            scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}
          />
        </SceneContainer>
      )}
    </SceneWrapper>
  )
}

export const StakeOptionsScene = withWallet(StakeOptionsSceneComponent)
