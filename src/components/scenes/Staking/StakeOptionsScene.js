// @flow
import * as React from 'react'
import { Image, View } from 'react-native'
import { FlatList, TouchableOpacity } from 'react-native-gesture-handler'
import { sprintf } from 'sprintf-js'

import s from '../../../locales/strings.js'
import { type StakePolicy } from '../../../plugins/stake-plugins'
import { type RootState } from '../../../reducers/RootReducer'
import { useEffect, useState } from '../../../types/reactHooks.js'
import { useSelector } from '../../../types/reactRedux'
import type { RouteProp } from '../../../types/routerTypes'
import { type NavigationProp } from '../../../types/routerTypes.js'
import { getCurrencyIcon } from '../../../util/CurrencyInfoHelpers'
import { getPolicyAssetName, getPolicyIconUris, getPolicyTitleName, stakePlugin } from '../../../util/stakeUtils.js'
import { FillLoader } from '../../common/FillLoader.js'
import { SceneWrapper } from '../../common/SceneWrapper.js'
import { cacheStyles, useTheme } from '../../services/ThemeContext.js'
import { EdgeText } from '../../themed/EdgeText.js'
import { SceneHeader } from '../../themed/SceneHeader.js'
import { StakingOptionCard } from '../../themed/StakingOptionCard.js'

type Props = {
  route: RouteProp<'stakeOptions'>,
  navigation: NavigationProp<'stakeOptions'>
}

export const StakeOptionsScene = (props: Props) => {
  const { walletId, currencyCode } = props.route.params
  const { navigation } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const walletImageUri = getCurrencyIcon('fantom').symbolImage
  const icon = <Image style={styles.icon} source={{ uri: walletImageUri }} />

  //
  // Stake Policies
  //

  const [stakePolicies, setStakePolicies] = useState<StakePolicy[]>([])
  useEffect(() => {
    stakePlugin
      .getStakePolicies()
      .then(stakePolicies => {
        const availableStakePolicies = stakePolicies.filter(stakePolicy => {
          return (
            stakePolicy.stakeAssets.some(stakeAsset => stakeAsset.tokenId === currencyCode) ||
            stakePolicy.rewardAssets.some(rewardAssets => rewardAssets.tokenId === currencyCode)
          )
        })

        if (availableStakePolicies.length === 1) {
          // Transition to next scene immediately
          navigation.replace('stakeOverview', { walletId, stakePolicy: stakePolicies[0] })
        } else setStakePolicies(availableStakePolicies)
      })
      .catch(err => console.error(err))
  }, [currencyCode, navigation, walletId])

  const currencyWallet = useSelector((state: RootState) => {
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

  const renderOptions = ({ item }) => {
    const primaryText = getPolicyAssetName(item, 'stakeAssets')
    const secondaryText = getPolicyTitleName(item)
    const key = [primaryText, secondaryText].join()
    const policyIcons = getPolicyIconUris(currencyWallet, item)
    return (
      <View key={key} style={styles.optionContainer}>
        <TouchableOpacity onPress={() => handleStakeOptionPress(item)}>
          <StakingOptionCard currencyLogos={policyIcons.stakeAssetUris} primaryText={primaryText} secondaryText={secondaryText} />
        </TouchableOpacity>
      </View>
    )
  }

  if (stakePolicies.length === 0)
    return (
      <SceneWrapper background="theme">
        <FillLoader />
      </SceneWrapper>
    )

  return (
    <SceneWrapper scroll background="theme">
      <SceneHeader style={styles.sceneHeader} title={sprintf(s.strings.staking_change_add_header, 'Tomb')} underline withTopMargin>
        {icon}
      </SceneHeader>
      <View style={styles.optionsContainer}>
        <EdgeText>{s.strings.stake_select_options}</EdgeText>
        <FlatList data={stakePolicies} renderItem={renderOptions} keyExtractor={(stakePolicy: StakePolicy) => stakePolicy.stakePolicyId} />
      </View>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles(theme => ({
  optionsContainer: {
    alignItems: 'stretch',
    margin: theme.rem(1),
    marginBottom: theme.rem(6)
  },
  optionContainer: {
    margin: theme.rem(1),
    marginBottom: 0
  },
  icon: {
    height: theme.rem(1.5),
    width: theme.rem(1.5),
    marginLeft: theme.rem(0.5),
    resizeMode: 'contain'
  },
  sceneHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center'
  }
}))
