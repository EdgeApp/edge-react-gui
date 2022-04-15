// @flow
import { toFixed } from 'biggystring'
import * as React from 'react'
import { View } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { sprintf } from 'sprintf-js'

import s from '../../../locales/strings.js'
import { type ChangeQuoteRequest, type PositionAllocation, type StakePolicy, type StakePosition } from '../../../plugins/stake-plugins'
import type { RootState } from '../../../reducers/RootReducer.js'
import { getDisplayDenominationFromState } from '../../../selectors/DenominationSelectors.js'
import { useEffect, useState } from '../../../types/reactHooks.js'
import { useDispatch, useSelector } from '../../../types/reactRedux'
import type { RouteProp } from '../../../types/routerTypes'
import { type NavigationProp } from '../../../types/routerTypes.js'
import { getWalletFiat } from '../../../util/CurrencyWalletHelpers.js'
import { getAllocationLocktimeMessage, getPolicyIconUris, getPolicyTitleName, getPositionAllocations, stakePlugin } from '../../../util/stakeUtils.js'
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
  const dispatch = useDispatch()
  const theme = useTheme()
  const styles = getStyles(theme)

  const currencyWallet = useSelector((state: RootState) => state.core.account.currencyWallets[walletId])
  const isoFiatCurrencyCode = getWalletFiat(currencyWallet).isoFiatCurrencyCode
  const displayDenomMap = [...stakePolicy.stakeAssets, ...stakePolicy.rewardAssets].reduce((denomMap, asset) => {
    denomMap[asset.tokenId] = dispatch(getDisplayDenominationFromState(currencyWallet.currencyInfo.pluginId, asset.tokenId))
    return denomMap
  }, {})
  const policyIcons = getPolicyIconUris(currencyWallet, stakePolicy)

  // Hooks
  const [stakeAllocations, setStakeAllocations] = useState<PositionAllocation[] | void>()
  const [rewardAllocations, setRewardAllocations] = useState<PositionAllocation[] | void>()
  const [stakePosition, setStakePosition] = useState<StakePosition | void>()

  // Background loop to force fetchStakePosition updates
  const [updateCounter, setUpdateCounter] = useState<number>(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setUpdateCounter(updateCounter => updateCounter + 1)
    }, 10 * 1000) // ten seconds
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    let abort = false
    stakePlugin
      .fetchStakePosition({ stakePolicyId, wallet: currencyWallet })
      .then(async stakePosition => {
        if (abort) return
        const guiAllocations = getPositionAllocations(stakePosition)
        setStakeAllocations(guiAllocations.staked)
        setRewardAllocations(guiAllocations.earned)
        setStakePosition(stakePosition)
      })
      .catch(err => {
        console.error(err)
      })

    return () => {
      abort = true
    }
  }, [currencyWallet, stakePolicyId, updateCounter])

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
    const denomination = displayDenomMap[tokenId]

    return (
      <CryptoFiatAmountTile
        title={title}
        nativeCryptoAmount={nativeAmount ?? '0'}
        cryptoCurrencyCode={tokenId}
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

  const estimatedReturnMsg = stakePolicy.apy > 0 ? toFixed(stakePolicy.apy.toString(), 1, 1) + '% APR' : 'N/A'
  return (
    <SceneWrapper background="theme">
      <SceneHeader style={styles.sceneHeader} title={getPolicyTitleName(stakePolicy)} withTopMargin />
      <View style={styles.card}>
        <StakingReturnsCard
          fromCurrencyLogos={policyIcons.stakeAssetUris}
          toCurrencyLogos={policyIcons.rewardAssetUris}
          text={sprintf(s.strings.stake_estimated_return, estimatedReturnMsg)}
        />
      </View>
      <FlatList
        data={[...stakeAllocations, ...rewardAllocations]}
        renderItem={renderCFAT}
        keyExtractor={(allocation: PositionAllocation) => allocation.tokenId + allocation.allocationType}
        ListFooterComponentStyle={styles.buttons}
        ListFooterComponent={
          <>
            <MainButton label={s.strings.stake_stake_more_funds} type="primary" onPress={handleModifyPress('stake')} marginRem={[0.5, 0.5, 0.25, 0.5]} />
            <MainButton
              label={s.strings.stake_claim_rewards}
              disabled={!stakePosition?.canClaim}
              type="secondary"
              onPress={handleModifyPress('claim')}
              marginRem={[0.25, 0.5, 0.25, 0.5]}
            />
            <MainButton
              label={s.strings.stake_unstake_claim}
              disabled={!stakePosition?.canUnstake}
              type="escape"
              onPress={handleModifyPress('unstake')}
              marginRem={[0.25, 0.5, 0.25, 0.5]}
            />
          </>
        }
      />
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
  },
  buttons: { marginTop: theme.rem(0.5) }
}))
