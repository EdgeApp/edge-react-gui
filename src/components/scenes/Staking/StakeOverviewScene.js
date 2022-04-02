// @flow
import { toFixed } from 'biggystring'
import * as React from 'react'
import { View } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { sprintf } from 'sprintf-js'

import s from '../../../locales/strings.js'
import { type ChangeQuoteRequest, type PositionAllocation, type StakePolicy, type StakePosition } from '../../../plugins/stake-plugins'
import type { RootState } from '../../../reducers/RootReducer.js'
import { getDisplayDenomination } from '../../../selectors/DenominationSelectors.js'
import { useEffect, useState } from '../../../types/reactHooks.js'
import { useSelector } from '../../../types/reactRedux'
import type { RouteProp } from '../../../types/routerTypes'
import { type NavigationProp } from '../../../types/routerTypes.js'
import { getWalletFiat } from '../../../util/CurrencyWalletHelpers.js'
import {
  getAllocationLocktimeMessage,
  getPolicyAssetName,
  getPolicyIconUris,
  getPolicyTitleName,
  getPositionAllocations,
  stakePlugin
} from '../../../util/stakeUtils.js'
import { FillLoader } from '../../common/FillLoader'
import { SceneWrapper } from '../../common/SceneWrapper.js'
import { cacheStyles, useTheme } from '../../services/ThemeContext.js'
import { CryptoFiatAmountTile } from '../../themed/CryptoFiatAmountTile.js'
import { MainButton } from '../../themed/MainButton.js'
import { SceneHeader } from '../../themed/SceneHeader.js'
import { StakingReturnsCard } from '../../themed/StakingReturnsCard.js'

type Props = {
  navigation: NavigationProp<'stakeModify'>,
  route: RouteProp<'stakeOverview'>
}

export const StakeOverviewScene = (props: Props) => {
  const { navigation } = props
  const { walletId } = props.route.params
  const stakePolicy: StakePolicy = props.route.params.stakePolicy
  const { stakePolicyId } = stakePolicy
  const theme = useTheme()
  const styles = getStyles(theme)

  // TODO: Update for denoms
  const stakeAssetsName = getPolicyAssetName(stakePolicy, 'stakeAssets')

  const { currencyWallet, walletPluginId, isoFiatCurrencyCode, state } = useSelector((state: RootState) => {
    const { currencyWallets } = state.core.account
    const currencyWallet = currencyWallets[walletId]
    const walletPluginId = currencyWallet.currencyInfo.pluginId
    const isoFiatCurrencyCode = getWalletFiat(currencyWallet).isoFiatCurrencyCode
    return { currencyWallet, walletPluginId, isoFiatCurrencyCode, state }
  })
  const policyIcons = getPolicyIconUris(currencyWallet, stakePolicy)

  // Hooks
  const [stakeAllocations, setStakeAllocations] = useState<PositionAllocation[] | void>()
  const [rewardAllocations, setRewardAllocations] = useState<PositionAllocation[] | void>()
  const [stakePosition, setStakePosition] = useState<StakePosition | void>()
  useEffect(() => {
    stakePlugin
      .fetchStakePosition({ stakePolicyId, wallet: currencyWallet })
      .then(async stakePosition => {
        const guiAllocations = getPositionAllocations(stakePosition)
        setStakeAllocations(guiAllocations.staked)
        setRewardAllocations(guiAllocations.earned)
        setStakePosition(stakePosition)
      })
      .catch(err => {
        console.error(err)
      })
  }, [currencyWallet, stakePolicyId])

  // Handlers
  const handleModifyPress = (modification: $PropertyType<ChangeQuoteRequest, 'action'>) => () => {
    if (stakePosition != null && stakeAllocations != null && rewardAllocations != null) {
      navigation.navigate('stakeModify', { walletId, stakePolicy, stakePosition, modification })
    }
  }

  // Renderers
  const renderCFAT = ({ item }) => {
    const { allocationType, tokenId, nativeAmount } = item
    const titleBase = allocationType === 'staked' ? s.strings.stake_s_staked : s.strings.stake_s_earned
    const title = `${sprintf(titleBase, tokenId)} ${getAllocationLocktimeMessage(item)}`
    const denomination = getDisplayDenomination(state, walletPluginId, tokenId)

    return (
      <CryptoFiatAmountTile
        title={title}
        nativeCryptoAmount={nativeAmount ?? '0'}
        cryptoCurrencyCode={stakeAssetsName}
        isoFiatCurrencyCode={isoFiatCurrencyCode}
        denomination={denomination}
      />
    )
  }

  if (stakeAllocations == null || rewardAllocations == null)
    return (
      <SceneWrapper background="theme">
        <FillLoader />
      </SceneWrapper>
    )

  return (
    <SceneWrapper background="theme">
      <SceneHeader style={styles.sceneHeader} title={getPolicyTitleName(stakePolicy)} withTopMargin />
      <View style={styles.card}>
        <StakingReturnsCard
          fromCurrencyLogos={policyIcons.stakeAssetUris}
          toCurrencyLogos={policyIcons.rewardAssetUris}
          text={sprintf(s.strings.stake_estimated_return, toFixed(stakePolicy.apy.toString(), 1, 1) + '%')}
        />
      </View>
      <FlatList
        data={[...stakeAllocations, ...rewardAllocations]}
        renderItem={renderCFAT}
        keyExtractor={(allocation: PositionAllocation) => allocation.tokenId + allocation.allocationType}
      />
      <MainButton label={s.strings.stake_stake_more_funds} type="primary" onPress={handleModifyPress('stake')} marginRem={0.5} />
      <MainButton label={s.strings.stake_claim_rewards} type="secondary" onPress={handleModifyPress('claim')} marginRem={0.5} />
      <MainButton label={s.strings.stake_unstake} type="escape" onPress={handleModifyPress('unstake')} marginRem={0.5} />
    </SceneWrapper>
  )
}

const getStyles = cacheStyles(theme => ({
  card: {
    justifyContent: 'flex-start',
    alignItems: 'center'
  },
  icon: {
    height: theme.rem(1.5),
    width: theme.rem(1.5),
    marginRight: theme.rem(0.5),
    resizeMode: 'contain'
  },
  sceneHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center'
  }
}))
