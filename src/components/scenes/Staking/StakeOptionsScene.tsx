import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { sprintf } from 'sprintf-js'

import { SCROLL_INDICATOR_INSET_FIX } from '../../../constants/constantSettings'
import { useIconColor } from '../../../hooks/useIconColor'
import { lstrings } from '../../../locales/strings'
import { StakePlugin, StakePolicy, StakePositionMap } from '../../../plugins/stake-plugins/types'
import { useSelector } from '../../../types/reactRedux'
import { EdgeSceneProps } from '../../../types/routerTypes'
import { getTokenIdForced } from '../../../util/CurrencyInfoHelpers'
import { getPluginFromPolicy, getPolicyAssetName, getPolicyIconUris, getPolicyTitleName } from '../../../util/stakeUtils'
import { darkenHexColor } from '../../../util/utils'
import { StakingOptionCard } from '../../cards/StakingOptionCard'
import { AccentColors } from '../../common/DotsBackground'
import { EdgeTouchableOpacity } from '../../common/EdgeTouchableOpacity'
import { SceneWrapper } from '../../common/SceneWrapper'
import { withWallet } from '../../hoc/withWallet'
import { CryptoIcon } from '../../icons/CryptoIcon'
import { cacheStyles, Theme, useTheme } from '../../services/ThemeContext'
import { EdgeText } from '../../themed/EdgeText'
import { SceneHeader } from '../../themed/SceneHeader'

interface Props extends EdgeSceneProps<'stakeOptions'> {
  wallet: EdgeCurrencyWallet
}

export interface StakeOptionsParams {
  stakePlugins: StakePlugin[]
  currencyCode: string
  stakePolicies: StakePolicy[]
  stakePositionMap: StakePositionMap
  walletId: string
}

const StakeOptionsSceneComponent = (props: Props) => {
  const { navigation, route, wallet } = props
  const { stakePlugins, walletId, currencyCode, stakePolicies, stakePositionMap } = route.params
  const theme = useTheme()
  const styles = getStyles(theme)

  const account = useSelector(state => state.core.account)
  const pluginId = wallet?.currencyInfo.pluginId
  const tokenId = pluginId ? getTokenIdForced(account, pluginId, currencyCode) : null
  const iconColor = useIconColor({ pluginId, tokenId })

  //
  // Handlers
  //

  const handleStakeOptionPress = (stakePolicy: StakePolicy) => {
    const { stakePolicyId } = stakePolicy
    const stakePlugin = getPluginFromPolicy(stakePlugins, stakePolicy)
    // Transition to next scene immediately
    const stakePosition = stakePositionMap[stakePolicyId]
    if (stakePlugin != null) navigation.push('stakeOverview', { stakePlugin, walletId: wallet.id, stakePolicy: stakePolicy, stakePosition })
  }

  //
  // Renders
  //

  const renderOptions = ({ item }: { item: StakePolicy }) => {
    const primaryText = getPolicyAssetName(item, 'stakeAssets')
    const secondaryText = getPolicyTitleName(item)
    const key = [primaryText, secondaryText].join()
    const policyIcons = getPolicyIconUris(wallet.currencyInfo, item)
    return (
      <View key={key} style={styles.optionContainer}>
        <EdgeTouchableOpacity onPress={() => handleStakeOptionPress(item)}>
          <StakingOptionCard
            currencyLogos={policyIcons.stakeAssetUris}
            primaryText={primaryText}
            secondaryText={secondaryText}
            stakeProviderInfo={item.stakeProviderInfo}
          />
        </EdgeTouchableOpacity>
      </View>
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
      scroll
      backgroundGradientColors={backgroundColors}
      backgroundGradientEnd={theme.assetBackgroundGradientEnd}
      backgroundGradientStart={theme.assetBackgroundGradientStart}
      overrideDots={theme.backgroundDots.assetOverrideDots}
    >
      <SceneHeader style={styles.sceneHeader} title={sprintf(lstrings.staking_change_add_header, currencyCode)} underline withTopMargin>
        <CryptoIcon marginRem={[0, 0, 0, 0.5]} walletId={walletId} tokenId={tokenId} sizeRem={1.5} />
      </SceneHeader>
      <View style={styles.optionsContainer}>
        <EdgeText>{lstrings.stake_select_options}</EdgeText>
        <FlatList
          data={stakePolicies}
          renderItem={renderOptions}
          keyExtractor={(stakePolicy: StakePolicy) => stakePolicy.stakePolicyId}
          scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}
        />
      </View>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  optionsContainer: {
    alignItems: 'stretch',
    marginBottom: theme.rem(6),
    marginHorizontal: theme.rem(1),
    marginTop: theme.rem(0.5)
  },
  optionContainer: {
    margin: theme.rem(1),
    marginBottom: 0
  },
  sceneHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center'
  }
}))

export const StakeOptionsScene = withWallet(StakeOptionsSceneComponent)
