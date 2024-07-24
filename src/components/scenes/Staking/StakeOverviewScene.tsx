import { EdgeCurrencyWallet, EdgeDenomination } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { sprintf } from 'sprintf-js'

import { SCROLL_INDICATOR_INSET_FIX } from '../../../constants/constantSettings'
import { useAsyncEffect } from '../../../hooks/useAsyncEffect'
import { lstrings } from '../../../locales/strings'
import { ChangeQuoteRequest, PositionAllocation, StakePlugin, StakePolicy, StakePosition } from '../../../plugins/stake-plugins/types'
import { selectDisplayDenomByCurrencyCode } from '../../../selectors/DenominationSelectors'
import { useDispatch, useSelector } from '../../../types/reactRedux'
import { EdgeSceneProps } from '../../../types/routerTypes'
import { getTokenIdForced } from '../../../util/CurrencyInfoHelpers'
import { getAllocationLocktimeMessage, getPolicyIconUris, getPolicyTitleName, getPositionAllocations } from '../../../util/stakeUtils'
import { StyledButtonContainer } from '../../buttons/ButtonsView'
import { StakingReturnsCard } from '../../cards/StakingReturnsCard'
import { SceneWrapper } from '../../common/SceneWrapper'
import { withWallet } from '../../hoc/withWallet'
import { FillLoader } from '../../progress-indicators/FillLoader'
import { Shimmer } from '../../progress-indicators/Shimmer'
import { showError } from '../../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../../services/ThemeContext'
import { MainButton } from '../../themed/MainButton'
import { SceneHeader } from '../../themed/SceneHeader'
import { CryptoFiatAmountTile } from '../../tiles/CryptoFiatAmountTile'

interface Props extends EdgeSceneProps<'stakeOverview'> {
  wallet: EdgeCurrencyWallet
}

export interface StakeOverviewParams {
  stakePlugin: StakePlugin
  stakePolicy: StakePolicy
  stakePosition?: StakePosition
  walletId: string
}

interface DenomMap {
  [cc: string]: EdgeDenomination
}

const StakeOverviewSceneComponent = (props: Props) => {
  const { navigation, route, wallet } = props
  const { stakePolicy, stakePosition: startingStakePosition, stakePlugin } = route.params
  const { stakePolicyId } = stakePolicy
  const dispatch = useDispatch()
  const theme = useTheme()
  const styles = getStyles(theme)

  const account = useSelector(state => state.core.account)

  const displayDenomMap: DenomMap = [...stakePolicy.stakeAssets, ...stakePolicy.rewardAssets].reduce((denomMap: DenomMap, asset) => {
    denomMap[asset.currencyCode] = dispatch((_, getState) => selectDisplayDenomByCurrencyCode(getState(), wallet.currencyConfig, asset.currencyCode))
    return denomMap
  }, {})
  const policyIcons = getPolicyIconUris(wallet.currencyInfo, stakePolicy)

  // Hooks
  const [stakeAllocations, setStakeAllocations] = React.useState<PositionAllocation[]>([])
  const [rewardAllocations, setRewardAllocations] = React.useState<PositionAllocation[]>([])
  const [unstakedAllocations, setUnstakedAllocations] = React.useState<PositionAllocation[]>([])
  const [stakePosition, setStakePosition] = React.useState<StakePosition | undefined>(startingStakePosition)

  // Background loop to force fetchStakePosition updates
  const [updateCounter, setUpdateCounter] = React.useState<number>(0)

  React.useEffect(() => {
    const interval = setInterval(() => {
      setUpdateCounter(updateCounter => updateCounter + 1)
    }, 10 * 1000) // ten seconds
    return () => clearInterval(interval)
  }, [])

  useAsyncEffect(
    async () => {
      let sp: StakePosition
      try {
        if (stakePosition == null) {
          sp = await stakePlugin.fetchStakePosition({ stakePolicyId, wallet, account })
          setStakePosition(sp)
        } else {
          const guiAllocations = getPositionAllocations(stakePosition)
          setStakeAllocations(guiAllocations.staked)
          setRewardAllocations(guiAllocations.earned)
          setUnstakedAllocations(guiAllocations.unstaked)
          setStakePosition(stakePosition)
        }
      } catch (err) {
        showError(err)
        console.error(err)
      }
    },
    [account, stakePlugin, stakePolicyId, stakePosition, updateCounter, wallet],
    'StakeOverviewSceneComponent'
  )

  // Handlers
  const handleModifyPress = (modification: ChangeQuoteRequest['action'] | 'unstakeAndClaim') => () => {
    const sceneTitleMap = {
      stake: getPolicyTitleName(stakePolicy),
      claim: lstrings.stake_claim_rewards,
      unstake: lstrings.stake_unstake,
      unstakeAndClaim: lstrings.stake_unstake_claim,
      unstakeExact: '' // Only for internal use
    }
    const title = sceneTitleMap[modification]

    if (modification === 'unstakeAndClaim') {
      modification = 'unstake'
    }

    if (stakePosition != null && stakeAllocations != null && rewardAllocations != null) {
      navigation.navigate('stakeModify', {
        modification,
        stakePlugin,
        stakePolicy,
        stakePosition,
        title,
        walletId: wallet.id
      })
    }
  }

  // Renderers
  const renderCFAT = ({ item }: { item: PositionAllocation }) => {
    const { allocationType, currencyCode, nativeAmount } = item
    const titleBase = allocationType === 'staked' ? lstrings.stake_s_staked : allocationType === 'earned' ? lstrings.stake_s_earned : lstrings.stake_s_unstaked
    const title = `${sprintf(titleBase, currencyCode)} ${getAllocationLocktimeMessage(item)}`
    const denomination = displayDenomMap[currencyCode]

    const tokenId = getTokenIdForced(account, wallet.currencyInfo.pluginId, currencyCode)
    return <CryptoFiatAmountTile title={title} nativeCryptoAmount={nativeAmount ?? '0'} tokenId={tokenId} denomination={denomination} walletId={wallet.id} />
  }

  const title = React.useMemo(() => getPolicyTitleName(stakePolicy), [stakePolicy])

  if (stakeAllocations == null || rewardAllocations == null)
    return (
      <SceneWrapper>
        <FillLoader />
      </SceneWrapper>
    )

  const { canStake = false, canClaim = false, canUnstakeAndClaim = false, canUnstake = false } = stakePosition ?? {}

  return (
    <SceneWrapper padding={theme.rem(0.5)} scroll>
      <SceneHeader title={title} withTopMargin />
      <View style={styles.card}>
        <StakingReturnsCard
          fromCurrencyLogos={policyIcons.stakeAssetUris}
          toCurrencyLogos={policyIcons.rewardAssetUris}
          apy={stakePolicy.apy}
          stakeProviderInfo={stakePolicy.stakeProviderInfo}
        />
      </View>
      {stakePosition == null ? (
        <>
          <View style={styles.shimmer}>
            <Shimmer isShown />
          </View>
          <View style={styles.shimmer}>
            <Shimmer isShown />
          </View>
        </>
      ) : null}
      <FlatList
        data={[...stakeAllocations, ...rewardAllocations, ...unstakedAllocations]}
        renderItem={renderCFAT}
        keyExtractor={(allocation: PositionAllocation) =>
          `${allocation.allocationType}${allocation.currencyCode}${allocation.nativeAmount}${getAllocationLocktimeMessage(allocation)}`
        }
        scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}
      />
      <StyledButtonContainer layout="column">
        <MainButton label={lstrings.stake_stake_more_funds} disabled={!canStake} type="primary" onPress={handleModifyPress('stake')} marginRem={0.5} />
        {stakePolicy.hideClaimAction ? null : (
          <MainButton label={lstrings.stake_claim_rewards} disabled={!canClaim} type="secondary" onPress={handleModifyPress('claim')} marginRem={0.5} />
        )}
        {stakePolicy.hideUnstakeAndClaimAction ? null : (
          <MainButton
            label={lstrings.stake_unstake_claim}
            disabled={!canUnstakeAndClaim}
            type="escape"
            onPress={handleModifyPress('unstakeAndClaim')}
            marginRem={0.5}
          />
        )}
        {stakePolicy.hideUnstakeAction ? null : (
          <MainButton label={lstrings.stake_unstake} disabled={!canUnstake} type="escape" onPress={handleModifyPress('unstake')} marginRem={0.5} />
        )}
      </StyledButtonContainer>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  card: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: theme.rem(0.5)
  },
  shimmer: {
    height: theme.rem(3),
    marginLeft: theme.rem(1),
    marginHorizontal: theme.rem(1),
    marginVertical: theme.rem(0.5)
  },
  icon: {
    height: theme.rem(1.5),
    width: theme.rem(1.5),
    marginRight: theme.rem(0.5),
    resizeMode: 'contain'
  }
}))

export const StakeOverviewScene = withWallet(StakeOverviewSceneComponent)
