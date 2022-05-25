// @flow
import { toFixed } from 'biggystring'
import * as React from 'react'
import { View } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { sprintf } from 'sprintf-js'

import s from '../../../locales/strings.js'
import { type ChangeQuoteRequest, type PositionAllocation, type StakePolicy, type StakePosition } from '../../../plugins/stake-plugins'
import { getSeed } from '../../../plugins/stake-plugins/util/getSeed'
import { getDisplayDenominationFromState } from '../../../selectors/DenominationSelectors.js'
import { useEffect, useState } from '../../../types/reactHooks.js'
import { useDispatch, useSelector } from '../../../types/reactRedux'
import type { RouteProp } from '../../../types/routerTypes'
import { type NavigationProp } from '../../../types/routerTypes.js'
import { guessFromCurrencyCode } from '../../../util/CurrencyInfoHelpers'
import { getAllocationLocktimeMessage, getPolicyIconUris, getPolicyTitleName, getPositionAllocations, stakePlugin } from '../../../util/stakeUtils.js'
import { FillLoader } from '../../common/FillLoader'
import { SceneWrapper } from '../../common/SceneWrapper.js'
import { cacheStyles, useTheme } from '../../services/ThemeContext.js'
import { MainButton } from '../../themed/MainButton.js'
import { SceneHeader } from '../../themed/SceneHeader.js'
import { StakingReturnsCard } from '../../themed/StakingReturnsCard.js'
import { CryptoFiatAmountTile } from '../../tiles/CryptoFiatAmountTile.js'

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

  const account = useSelector(state => state.core.account)
  const wallet = account.currencyWallets[walletId]

  const displayDenomMap = [...stakePolicy.stakeAssets, ...stakePolicy.rewardAssets].reduce((denomMap, asset) => {
    denomMap[asset.currencyCode] = dispatch(getDisplayDenominationFromState(wallet.currencyInfo.pluginId, asset.currencyCode))
    return denomMap
  }, {})
  const policyIcons = getPolicyIconUris(wallet.currencyInfo, stakePolicy)

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
      .fetchStakePosition({ stakePolicyId, signerSeed: getSeed(wallet) })
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
  }, [wallet, stakePolicyId, updateCounter])

  // Handlers
  const handleModifyPress = (modification: $PropertyType<ChangeQuoteRequest, 'action'>) => () => {
    if (stakePosition != null && stakeAllocations != null && rewardAllocations != null) {
      navigation.navigate('stakeModify', { walletId, stakePolicy, stakePosition, modification })
    }
  }

  // Renderers
  const renderCFAT = ({ item }) => {
    const { allocationType, currencyCode, nativeAmount } = item
    const titleBase = allocationType === 'staked' ? s.strings.stake_s_staked : s.strings.stake_s_earned
    const title = `${sprintf(titleBase, currencyCode)} ${getAllocationLocktimeMessage(item)}`
    const denomination = displayDenomMap[currencyCode]

    const tokenId = guessFromCurrencyCode(account, { currencyCode, pluginId: wallet.currencyInfo.pluginId }).tokenId
    return tokenId != null ? (
      <CryptoFiatAmountTile title={title} nativeCryptoAmount={nativeAmount ?? '0'} tokenId={tokenId} denomination={denomination} walletId={walletId} />
    ) : null
  }

  if (stakeAllocations == null || rewardAllocations == null)
    return (
      <SceneWrapper background="theme">
        <FillLoader />
      </SceneWrapper>
    )

  const estimatedReturnMsg = stakePolicy.apy > 0 ? toFixed(stakePolicy.apy.toString(), 1, 1) + '% APR' : 'N/A'
  return (
    <SceneWrapper scroll background="theme">
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
        keyExtractor={(allocation: PositionAllocation) => allocation.currencyCode + allocation.allocationType}
      />
      <MainButton
        label={s.strings.stake_stake_more_funds}
        disabled={!stakePosition?.canStake}
        type="primary"
        onPress={handleModifyPress('stake')}
        marginRem={[0.5, 0.5, 0.25, 0.5]}
      />
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
