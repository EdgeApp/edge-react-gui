import { useIsFocused } from '@react-navigation/native'
import { EdgeCurrencyWallet, EdgeDenomination } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { useSafeAreaFrame } from 'react-native-safe-area-context'
import { sprintf } from 'sprintf-js'

import { updateStakingPosition } from '../../../actions/scene/StakingActions'
import { SCROLL_INDICATOR_INSET_FIX } from '../../../constants/constantSettings'
import { useAsyncEffect } from '../../../hooks/useAsyncEffect'
import { useAsyncValue } from '../../../hooks/useAsyncValue'
import { lstrings } from '../../../locales/strings'
import { getStakePlugins } from '../../../plugins/stake-plugins/stakePlugins'
import { ChangeQuoteRequest, PositionAllocation, StakePlugin, StakePolicy, StakePosition } from '../../../plugins/stake-plugins/types'
import { selectDisplayDenomByCurrencyCode } from '../../../selectors/DenominationSelectors'
import { useDispatch, useSelector } from '../../../types/reactRedux'
import { EdgeSceneProps } from '../../../types/routerTypes'
import { getTokenIdForced } from '../../../util/CurrencyInfoHelpers'
import { infoServerData } from '../../../util/network'
import { makePeriodicTask } from '../../../util/PeriodicTask'
import { enableStakeTokens, getAllocationLocktimeMessage, getPolicyIconUris, getPolicyTitleName, getPositionAllocations } from '../../../util/stakeUtils'
import { SceneButtons } from '../../buttons/SceneButtons'
import { AlertCardUi4 } from '../../cards/AlertCard'
import { InfoCardCarousel } from '../../cards/InfoCardCarousel'
import { StakingReturnsCard } from '../../cards/StakingReturnsCard'
import { fadeInDown10 } from '../../common/EdgeAnim'
import { SceneWrapper } from '../../common/SceneWrapper'
import { withWallet } from '../../hoc/withWallet'
import { SceneContainer } from '../../layout/SceneContainer'
import { FillLoader } from '../../progress-indicators/FillLoader'
import { Shimmer } from '../../progress-indicators/Shimmer'
import { showError } from '../../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../../services/ThemeContext'
import { CryptoFiatAmountTile } from '../../tiles/CryptoFiatAmountTile'

interface Props extends EdgeSceneProps<'stakeOverview'> {
  wallet: EdgeCurrencyWallet
}

export interface StakeOverviewParams {
  stakePlugin: StakePlugin
  stakePolicyId: string
  walletId: string
}

interface DenomMap {
  [cc: string]: EdgeDenomination
}

const StakeOverviewSceneComponent = (props: Props) => {
  const { navigation, route, wallet } = props
  const { stakePlugin, stakePolicyId } = route.params

  const stakeState = useSelector(state => state.staking.walletStakingMap[wallet.id])
  const [stakePolicies] = useAsyncValue(async () => {
    const plugins = await getStakePlugins(wallet.currencyInfo.pluginId)
    return plugins.flatMap(stakePlugin => stakePlugin.getPolicies())
  })
  const stakePolicy: StakePolicy | undefined = stakePolicies?.find(policy => policy.stakePolicyId === stakePolicyId)
  const stakePosition: StakePosition | undefined = stakeState?.stakePositionMap[stakePolicyId]
  const isStakeStateLoading = stakeState == null || stakeState.isLoading

  const dispatch = useDispatch()
  const theme = useTheme()
  const styles = getStyles(theme)

  const account = useSelector(state => state.core.account)
  const countryCode = useSelector(state => state.ui.countryCode)
  const { width: screenWidth } = useSafeAreaFrame()

  // We wait for state only when liquid staking is enabled
  // This is because liquid staking actions are dependent on the position state.
  // If the position state is not loaded and update-to-date, then the buttons
  // will not be enabled/disabled properly. So we must wait for the state to load.
  const waitingOnStateLoading = isStakeStateLoading && stakePolicy?.isLiquidStaking === true

  const displayDenomMap: DenomMap =
    stakePolicy == null
      ? {}
      : [...stakePolicy.stakeAssets, ...stakePolicy.rewardAssets].reduce((denomMap: DenomMap, asset) => {
          denomMap[asset.currencyCode] = dispatch((_, getState) =>
            selectDisplayDenomByCurrencyCode(getState(), account.currencyConfig[asset.pluginId], asset.currencyCode)
          )
          return denomMap
        }, {})
  const policyIcons = stakePolicy == null ? { stakeAssetUris: [], rewardAssetUris: [] } : getPolicyIconUris(account.currencyConfig, stakePolicy)

  // Hooks

  const [stakeAllocations, setStakeAllocations] = React.useState<PositionAllocation[]>([])
  const [rewardAllocations, setRewardAllocations] = React.useState<PositionAllocation[]>([])
  const [unstakedAllocations, setUnstakedAllocations] = React.useState<PositionAllocation[]>([])

  // Update the position on scene focus
  const isFocused = useIsFocused()
  React.useEffect(() => {
    if (isFocused) {
      dispatch(updateStakingPosition(stakePlugin, stakePolicyId, wallet, account)).catch(err => showError(err))
    }
  }, [account, dispatch, isFocused, stakePlugin, stakePolicyId, wallet])

  // Update the position every minute
  React.useEffect(() => {
    const task = makePeriodicTask(() => {
      dispatch(updateStakingPosition(stakePlugin, stakePolicyId, wallet, account)).catch(err => showError(err))
    }, 60 * 1000)
    task.start()
    return () => task.stop()
  }, [account, dispatch, stakePlugin, stakePolicyId, wallet])

  useAsyncEffect(
    async () => {
      if (stakePosition != null) {
        const guiAllocations = getPositionAllocations(stakePosition)
        setStakeAllocations(guiAllocations.staked)
        setRewardAllocations(guiAllocations.earned)
        setUnstakedAllocations(guiAllocations.unstaked)
      }
    },
    [stakePosition],
    'StakeOverviewSceneComponent'
  )

  // Ensure required tokens are enabled
  useAsyncEffect(
    async () => {
      if (stakePolicy == null) return
      await enableStakeTokens(account, wallet, stakePolicy)
    },
    [stakePolicy],
    'StakeOverviewSceneComponent 1'
  )

  // Handlers
  const handleModifyPress = (modification: ChangeQuoteRequest['action'] | 'unstakeAndClaim') => () => {
    if (stakePolicy == null) return
    const sceneTitleMap = {
      stake: getPolicyTitleName(stakePolicy, countryCode),
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
        title,
        walletId: wallet.id
      })
    }
  }

  // Renderers
  const renderCFAT = ({ item }: { item: PositionAllocation }) => {
    const { allocationType, currencyCode, nativeAmount, pluginId } = item
    const titleBase = allocationType === 'staked' ? lstrings.stake_s_staked : allocationType === 'earned' ? lstrings.stake_s_earned : lstrings.stake_s_unstaked
    const title = `${sprintf(titleBase, currencyCode)}${getAllocationLocktimeMessage(item)}`
    const denomination = displayDenomMap[currencyCode]

    const tokenId = getTokenIdForced(account, pluginId, currencyCode)
    return <CryptoFiatAmountTile title={title} nativeCryptoAmount={nativeAmount ?? '0'} tokenId={tokenId} denomination={denomination} walletId={wallet.id} />
  }

  const title = React.useMemo(() => (stakePolicy == null ? '' : getPolicyTitleName(stakePolicy, countryCode)), [stakePolicy, countryCode])

  if (stakeAllocations == null || rewardAllocations == null)
    return (
      <SceneWrapper>
        <FillLoader />
      </SceneWrapper>
    )

  const { canStake = false, canClaim = false, canUnstakeAndClaim = false, canUnstake = false } = stakePosition ?? {}

  if (stakePolicy == null) return null

  return (
    <SceneWrapper scroll>
      <SceneContainer headerTitle={title}>
        <InfoCardCarousel
          enterAnim={fadeInDown10}
          cards={(infoServerData.rollup?.stakeStatusCards ?? {})[stakePolicyId]}
          navigation={navigation}
          screenWidth={screenWidth}
        />
        <StakingReturnsCard
          fromCurrencyLogos={policyIcons.stakeAssetUris}
          toCurrencyLogos={policyIcons.rewardAssetUris}
          apy={stakePolicy.apy}
          stakeProviderInfo={stakePolicy.stakeProviderInfo}
        />
        {stakePosition == null || isStakeStateLoading ? (
          <>
            <View style={styles.shimmer}>
              <Shimmer isShown />
            </View>
            <View style={styles.shimmer}>
              <Shimmer isShown />
            </View>
          </>
        ) : (
          <FlatList
            data={[...stakeAllocations, ...rewardAllocations, ...unstakedAllocations]}
            renderItem={renderCFAT}
            keyExtractor={(allocation: PositionAllocation) =>
              `${allocation.allocationType}${allocation.currencyCode}${allocation.nativeAmount}${getAllocationLocktimeMessage(allocation)}`
            }
            scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}
          />
        )}
        <AlertCardUi4 type="warning" title={lstrings.string_warning} body={lstrings.warning_earn} />
        {waitingOnStateLoading ? null : (
          <SceneButtons
            primary={{
              label: lstrings.fragment_stake_label,
              disabled: !canStake,
              onPress: handleModifyPress('stake')
            }}
            secondary={
              stakePolicy.hideClaimAction
                ? undefined
                : {
                    label: lstrings.stake_claim_rewards,
                    disabled: !canClaim,
                    onPress: handleModifyPress('claim')
                  }
            }
            tertiary={
              stakePolicy.hideUnstakeAndClaimAction
                ? stakePolicy.hideUnstakeAction
                  ? undefined
                  : {
                      label: lstrings.stake_unstake,
                      disabled: !canUnstake,
                      onPress: handleModifyPress('unstake')
                    }
                : {
                    label: lstrings.stake_unstake_claim,
                    disabled: !canUnstakeAndClaim,
                    onPress: handleModifyPress('unstakeAndClaim')
                  }
            }
          />
        )}
      </SceneContainer>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
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
