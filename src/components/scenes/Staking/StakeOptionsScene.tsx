import * as React from 'react'
import { View } from 'react-native'
import { FlatList, TouchableOpacity } from 'react-native-gesture-handler'
import { sprintf } from 'sprintf-js'

import s from '../../../locales/strings'
import { StakePolicy } from '../../../plugins/stake-plugins/types'
import { RootState } from '../../../reducers/RootReducer'
import { useSelector } from '../../../types/reactRedux'
import { NavigationProp, RouteProp } from '../../../types/routerTypes'
import { getTokenId } from '../../../util/CurrencyInfoHelpers'
import { getPluginFromPolicy, getPolicyAssetName, getPolicyIconUris, getPolicyTitleName } from '../../../util/stakeUtils'
import { StakingOptionCard } from '../../cards/StakingOptionCard'
import { SceneWrapper } from '../../common/SceneWrapper'
import { CryptoIcon } from '../../icons/CryptoIcon'
import { cacheStyles, Theme, useTheme } from '../../services/ThemeContext'
import { EdgeText } from '../../themed/EdgeText'
import { SceneHeader } from '../../themed/SceneHeader'

interface Props {
  route: RouteProp<'stakeOptions'>
  navigation: NavigationProp<'stakeOptions'>
}

export const StakeOptionsScene = (props: Props) => {
  const { stakePlugins, walletId, currencyCode, stakePolicies } = props.route.params
  const { navigation } = props
  const { account } = useSelector(state => state.core)
  const theme = useTheme()
  const styles = getStyles(theme)

  //
  // Stake Policies
  //

  React.useEffect(() => {
    if (stakePolicies.length === 1) {
      const stakePlugin = getPluginFromPolicy(stakePlugins, stakePolicies[0])
      // Transition to next scene immediately
      if (stakePlugin != null) navigation.replace('stakeOverview', { stakePlugin, walletId, stakePolicy: stakePolicies[0] })
    }
    return undefined
  }, [stakePolicies, navigation, walletId])

  const wallet = useSelector((state: RootState) => {
    const { currencyWallets } = state.core.account
    return currencyWallets[walletId]
  })

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

  const renderSceneHeader = () => (
    <SceneHeader style={styles.sceneHeader} title={sprintf(s.strings.staking_change_add_header, currencyCode)} underline withTopMargin>
      <CryptoIcon marginRem={[0, 0.5, 0, 0]} walletId={walletId} tokenId={tokenId} sizeRem={1.5} />
    </SceneHeader>
  )

  return (
    <SceneWrapper scroll background="theme">
      {renderSceneHeader()}
      <View style={styles.optionsContainer}>
        <EdgeText>{s.strings.stake_select_options}</EdgeText>
        <FlatList data={stakePolicies} renderItem={renderOptions} keyExtractor={(stakePolicy: StakePolicy) => stakePolicy.stakePolicyId} />
      </View>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  optionsContainer: {
    alignItems: 'stretch',
    margin: theme.rem(1),
    marginBottom: theme.rem(6)
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
