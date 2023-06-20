import { FlashList } from '@shopify/flash-list'
import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { sprintf } from 'sprintf-js'

import { lstrings } from '../../../locales/strings'
import { StakePolicy } from '../../../plugins/stake-plugins/types'
import { useSelector } from '../../../types/reactRedux'
import { EdgeSceneProps } from '../../../types/routerTypes'
import { getTokenId } from '../../../util/CurrencyInfoHelpers'
import { getPluginFromPolicy, getPolicyAssetName, getPolicyIconUris, getPolicyTitleName } from '../../../util/stakeUtils'
import { StakingOptionCard } from '../../cards/StakingOptionCard'
import { SceneWrapper } from '../../common/SceneWrapper'
import { withWallet } from '../../hoc/withWallet'
import { CryptoIcon } from '../../icons/CryptoIcon'
import { cacheStyles, Theme, useTheme } from '../../services/ThemeContext'
import { EdgeText } from '../../themed/EdgeText'
import { SceneHeader } from '../../themed/SceneHeader'

interface Props extends EdgeSceneProps<'stakeOptions'> {
  wallet: EdgeCurrencyWallet
}

const StakeOptionsSceneComponent = (props: Props) => {
  const { navigation, route, wallet } = props
  const { stakePlugins, walletId, currencyCode, stakePolicies } = route.params
  const theme = useTheme()
  const styles = getStyles(theme)

  const account = useSelector(state => state.core.account)
  const pluginId = wallet?.currencyInfo.pluginId
  const tokenId = pluginId ? getTokenId(account, pluginId, currencyCode) : undefined

  //
  // Handlers
  //

  const handleStakeOptionPress = (stakePolicy: StakePolicy) => {
    const stakePlugin = getPluginFromPolicy(stakePlugins, stakePolicy)
    if (stakePlugin != null) navigation.navigate('stakeOverview', { stakePlugin, walletId, stakePolicy })
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
        <TouchableOpacity onPress={() => handleStakeOptionPress(item)}>
          <StakingOptionCard
            currencyLogos={policyIcons.stakeAssetUris}
            primaryText={primaryText}
            secondaryText={secondaryText}
            stakeProviderInfo={item.stakeProviderInfo}
          />
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <SceneWrapper scroll background="theme">
      <SceneHeader style={styles.sceneHeader} title={sprintf(lstrings.staking_change_add_header, currencyCode)} underline withTopMargin>
        <CryptoIcon marginRem={[0, 0, 0, 0.5]} walletId={walletId} tokenId={tokenId} sizeRem={1.5} />
      </SceneHeader>
      <View style={styles.optionsContainer}>
        <EdgeText>{lstrings.stake_select_options}</EdgeText>
        <FlashList data={stakePolicies} renderItem={renderOptions} keyExtractor={(stakePolicy: StakePolicy) => stakePolicy.stakePolicyId} />
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
