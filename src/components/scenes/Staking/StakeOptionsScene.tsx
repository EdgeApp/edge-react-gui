import * as React from 'react'
import { View } from 'react-native'
import { FlatList, TouchableOpacity } from 'react-native-gesture-handler'
import { sprintf } from 'sprintf-js'

import s from '../../../locales/strings'
import { StakePolicy } from '../../../plugins/stake-plugins'
import { RootState } from '../../../reducers/RootReducer'
import { useSelector } from '../../../types/reactRedux'
import { NavigationProp, RouteProp } from '../../../types/routerTypes'
import { getPolicyAssetName, getPolicyIconUris, getPolicyTitleName } from '../../../util/stakeUtils'
import { StakingOptionCard } from '../../cards/StakingOptionCard'
import { SceneWrapper } from '../../common/SceneWrapper'
import { CryptoIcon } from '../../icons/CryptoIcon'
import { cacheStyles, Theme, useTheme } from '../../services/ThemeContext'
import { EdgeText } from '../../themed/EdgeText'
import { SceneHeader } from '../../themed/SceneHeader'

type Props = {
  route: RouteProp<'stakeOptions'>
  navigation: NavigationProp<'stakeOptions'>
}

export const StakeOptionsScene = (props: Props) => {
  const { walletId, currencyCode, stakePolicies } = props.route.params
  const { navigation } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const icon = React.useMemo(() => <CryptoIcon marginRem={[0, 0.5, 0, 0]} pluginId="fantom" sizeRem={1.5} />, [])

  //
  // Stake Policies
  //

  React.useEffect(() => {
    if (stakePolicies.length === 1) {
      // Transition to next scene immediately
      navigation.replace('stakeOverview', { walletId, stakePolicy: stakePolicies[0] })
    }
    return undefined
  }, [stakePolicies, navigation, walletId])

  const wallet = useSelector((state: RootState) => {
    const { currencyWallets } = state.core.account
    return currencyWallets[walletId]
  })

  //
  // Handlers
  //

  const handleStakeOptionPress = (stakePolicy: StakePolicy) => {
    navigation.navigate('stakeOverview', { walletId, stakePolicy })
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
      {icon}
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
