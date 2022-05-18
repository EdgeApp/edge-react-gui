// @flow
import * as React from 'react'
import { View } from 'react-native'
import { FlatList, TouchableOpacity } from 'react-native-gesture-handler'
import { sprintf } from 'sprintf-js'

import s from '../../../locales/strings.js'
import { type StakePolicy } from '../../../plugins/stake-plugins'
import { type RootState } from '../../../reducers/RootReducer'
import { useEffect, useState } from '../../../types/reactHooks.js'
import { useSelector } from '../../../types/reactRedux'
import type { RouteProp } from '../../../types/routerTypes'
import { type NavigationProp } from '../../../types/routerTypes.js'
import { getPolicyAssetName, getPolicyIconUris, getPolicyTitleName, stakePlugin } from '../../../util/stakeUtils.js'
import { FillLoader } from '../../common/FillLoader.js'
import { SceneWrapper } from '../../common/SceneWrapper.js'
import { cacheStyles, useTheme } from '../../services/ThemeContext.js'
import { CurrencyIcon } from '../../themed/CurrencyIcon.js'
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
  const icon = <CurrencyIcon marginRem={[0, 0.5, 0, 0]} pluginId="fantom" sizeRem={1.5} />

  //
  // Stake Policies
  //

  const [stakePolicies, setStakePolicies] = useState<StakePolicy[]>([])
  useEffect(() => {
    let abort = false

    stakePlugin
      .getStakePolicies()
      .then(stakePolicies => {
        if (abort) return
        const availableStakePolicies = stakePolicies.filter(stakePolicy => {
          return (
            stakePolicy.stakeAssets.some(stakeAsset => stakeAsset.currencyCode === currencyCode) ||
            stakePolicy.rewardAssets.some(rewardAssets => rewardAssets.currencyCode === currencyCode)
          )
        })
        if (availableStakePolicies.length === 1) {
          // Transition to next scene immediately
          navigation.replace('stakeOverview', { walletId, stakePolicy: stakePolicies[0] })
        } else setStakePolicies(availableStakePolicies)
      })
      .catch(err => console.error(err))

    return () => {
      abort = true
    }
  }, [currencyCode, navigation, walletId])

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
            liquidityPool={item.liquidityPool}
          />
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
      <SceneHeader style={styles.sceneHeader} title={sprintf(s.strings.staking_change_add_header, currencyCode)} underline withTopMargin>
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
  sceneHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center'
  }
}))
