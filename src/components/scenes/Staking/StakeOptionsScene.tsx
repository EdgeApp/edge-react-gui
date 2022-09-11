import * as React from 'react'
import { View } from 'react-native'
import { FlatList, TouchableOpacity } from 'react-native-gesture-handler'
import { sprintf } from 'sprintf-js'

import s from '../../../locales/strings'
import { StakePolicy } from '../../../plugins/stake-plugins'
import { RootState } from '../../../reducers/RootReducer'
import { useEffect, useMemo, useState } from '../../../types/reactHooks'
import { useSelector } from '../../../types/reactRedux'
import { NavigationProp, RouteProp } from '../../../types/routerTypes'
import { getPolicyAssetName, getPolicyIconUris, getPolicyTitleName, stakePlugin } from '../../../util/stakeUtils'
import { StakingOptionCard } from '../../cards/StakingOptionCard'
import { SceneWrapper } from '../../common/SceneWrapper'
import { CryptoIcon } from '../../icons/CryptoIcon'
import { FillLoader } from '../../progress-indicators/FillLoader'
import { cacheStyles, useTheme } from '../../services/ThemeContext'
import { EdgeText } from '../../themed/EdgeText'
import { SceneHeader } from '../../themed/SceneHeader'

type Props = {
  route: RouteProp<'stakeOptions'>
  navigation: NavigationProp<'stakeOptions'>
}

export const StakeOptionsScene = (props: Props) => {
  const { walletId, currencyCode } = props.route.params
  const { navigation } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const icon = useMemo(() => <CryptoIcon marginRem={[0, 0.5, 0, 0]} pluginId="fantom" sizeRem={1.5} />, [])

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
          navigation.replace('stakeOverview', { walletId, stakePolicy: availableStakePolicies[0] })
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
          {/* @ts-expect-error */}
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

  const sceneHeader = useMemo(
    () => (
      <SceneHeader style={styles.sceneHeader} title={sprintf(s.strings.staking_change_add_header, currencyCode)} underline withTopMargin>
        {icon}
      </SceneHeader>
    ),
    [currencyCode, icon, styles.sceneHeader]
  )

  if (stakePolicies.length === 0)
    return (
      <SceneWrapper background="theme">
        <FillLoader />
      </SceneWrapper>
    )

  return (
    <SceneWrapper scroll background="theme">
      {sceneHeader}
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
    // @ts-expect-error
    margin: theme.rem(1),
    // @ts-expect-error
    marginBottom: theme.rem(6)
  },
  optionContainer: {
    // @ts-expect-error
    margin: theme.rem(1),
    marginBottom: 0
  },
  sceneHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center'
  }
}))
