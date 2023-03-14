import { FlashList } from '@shopify/flash-list'
import { EdgeCurrencyWallet, EdgeDenomination } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'
import { sprintf } from 'sprintf-js'

import s from '../../../locales/strings'
import { ChangeQuoteRequest, PositionAllocation, StakePosition } from '../../../plugins/stake-plugins/types'
import { getDisplayDenominationFromState } from '../../../selectors/DenominationSelectors'
import { useDispatch, useSelector } from '../../../types/reactRedux'
import { NavigationProp, RouteProp } from '../../../types/routerTypes'
import { guessFromCurrencyCode } from '../../../util/CurrencyInfoHelpers'
import { getAllocationLocktimeMessage, getPolicyIconUris, getPolicyTitleName, getPositionAllocations, getUnstakeText } from '../../../util/stakeUtils'
import { StakingReturnsCard } from '../../cards/StakingReturnsCard'
import { SceneWrapper } from '../../common/SceneWrapper'
import { withWallet } from '../../hoc/withWallet'
import { FillLoader } from '../../progress-indicators/FillLoader'
import { showError } from '../../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../../services/ThemeContext'
import { MainButton } from '../../themed/MainButton'
import { SceneHeader } from '../../themed/SceneHeader'
import { CryptoFiatAmountTile } from '../../tiles/CryptoFiatAmountTile'

interface Props {
  navigation: NavigationProp<'stakeModify'>
  route: RouteProp<'stakeOverview'>
  wallet: EdgeCurrencyWallet
}

interface DenomMap {
  [cc: string]: EdgeDenomination
}

const StakeOverviewSceneComponent = (props: Props) => {
  const { navigation, route, wallet } = props
  const { stakePolicy, stakePlugin } = route.params
  const { stakePolicyId } = stakePolicy
  const dispatch = useDispatch()
  const theme = useTheme()
  const styles = getStyles(theme)

  const account = useSelector(state => state.core.account)

  const displayDenomMap: DenomMap = [...stakePolicy.stakeAssets, ...stakePolicy.rewardAssets].reduce((denomMap: DenomMap, asset) => {
    denomMap[asset.currencyCode] = dispatch(getDisplayDenominationFromState(wallet.currencyInfo.pluginId, asset.currencyCode))
    return denomMap
  }, {})
  const policyIcons = getPolicyIconUris(wallet.currencyInfo, stakePolicy)

  // Hooks
  const [stakeAllocations, setStakeAllocations] = React.useState<PositionAllocation[]>([])
  const [rewardAllocations, setRewardAllocations] = React.useState<PositionAllocation[]>([])
  const [stakePosition, setStakePosition] = React.useState<StakePosition | undefined>()

  // Background loop to force fetchStakePosition updates
  const [updateCounter, setUpdateCounter] = React.useState<number>(0)

  React.useEffect(() => {
    const interval = setInterval(() => {
      setUpdateCounter(updateCounter => updateCounter + 1)
    }, 10 * 1000) // ten seconds
    return () => clearInterval(interval)
  }, [])

  React.useEffect(() => {
    let abort = false
    stakePlugin
      .fetchStakePosition({ stakePolicyId, wallet })
      .then(async stakePosition => {
        if (abort) return
        const guiAllocations = getPositionAllocations(stakePosition)
        setStakeAllocations(guiAllocations.staked)
        setRewardAllocations(guiAllocations.earned)
        setStakePosition(stakePosition)
      })
      .catch(err => {
        showError(err)
        console.error(err)
      })

    return () => {
      abort = true
    }
  }, [wallet, stakePolicyId, stakePlugin, updateCounter])

  // Handlers
  const handleModifyPress = (modification: ChangeQuoteRequest['action']) => () => {
    if (stakePosition != null && stakeAllocations != null && rewardAllocations != null) {
      navigation.navigate('stakeModify', {
        modification,
        stakePlugin,
        stakePolicy,
        stakePosition,
        walletId: wallet.id
      })
    }
  }

  // Renderers
  const renderCFAT = ({ item }: { item: PositionAllocation }) => {
    const { allocationType, currencyCode, nativeAmount } = item
    const titleBase = allocationType === 'staked' ? s.strings.stake_s_staked : s.strings.stake_s_earned
    const title = `${sprintf(titleBase, currencyCode)} ${getAllocationLocktimeMessage(item)}`
    const denomination = displayDenomMap[currencyCode]

    const tokenId = guessFromCurrencyCode(account, { currencyCode, pluginId: wallet.currencyInfo.pluginId }).tokenId
    return <CryptoFiatAmountTile title={title} nativeCryptoAmount={nativeAmount ?? '0'} tokenId={tokenId} denomination={denomination} walletId={wallet.id} />
  }

  const sceneHeader = React.useMemo(
    () => <SceneHeader style={styles.sceneHeader} title={getPolicyTitleName(stakePolicy)} withTopMargin />,
    [stakePolicy, styles.sceneHeader]
  )

  if (stakeAllocations == null || rewardAllocations == null)
    return (
      <SceneWrapper background="theme">
        <FillLoader />
      </SceneWrapper>
    )

  const unstakeText = getUnstakeText(stakePolicy)

  return (
    <SceneWrapper scroll background="theme">
      {sceneHeader}
      <View style={styles.card}>
        <StakingReturnsCard
          fromCurrencyLogos={policyIcons.stakeAssetUris}
          toCurrencyLogos={policyIcons.rewardAssetUris}
          apy={stakePolicy.apy}
          stakeProviderInfo={stakePolicy.stakeProviderInfo}
        />
      </View>
      <FlashList
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
      {stakePolicy.rewardsNotClaimable ? null : (
        <MainButton
          label={s.strings.stake_claim_rewards}
          disabled={!stakePosition?.canClaim}
          type="secondary"
          onPress={handleModifyPress('claim')}
          marginRem={[0.25, 0.5, 0.25, 0.5]}
        />
      )}
      <MainButton
        label={unstakeText}
        disabled={!stakePosition?.canUnstake}
        type="escape"
        onPress={handleModifyPress('unstake')}
        marginRem={[0.25, 0.5, 0.25, 0.5]}
      />
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
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

export const StakeOverviewScene = withWallet(StakeOverviewSceneComponent)
