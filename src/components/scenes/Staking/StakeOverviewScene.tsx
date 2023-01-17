import { toFixed } from 'biggystring'
import * as React from 'react'
import { View } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { sprintf } from 'sprintf-js'

import s from '../../../locales/strings'
import { ChangeQuoteRequest, PositionAllocation, StakePosition } from '../../../plugins/stake-plugins/types'
import { getDisplayDenominationFromState } from '../../../selectors/DenominationSelectors'
import { useDispatch, useSelector } from '../../../types/reactRedux'
import { NavigationProp, RouteProp } from '../../../types/routerTypes'
import { guessFromCurrencyCode } from '../../../util/CurrencyInfoHelpers'
import { getAllocationLocktimeMessage, getPolicyIconUris, getPolicyTitleName, getPositionAllocations } from '../../../util/stakeUtils'
import { StakingReturnsCard } from '../../cards/StakingReturnsCard'
import { SceneWrapper } from '../../common/SceneWrapper'
import { FillLoader } from '../../progress-indicators/FillLoader'
import { showError } from '../../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../../services/ThemeContext'
import { MainButton } from '../../themed/MainButton'
import { SceneHeader } from '../../themed/SceneHeader'
import { CryptoFiatAmountTile } from '../../tiles/CryptoFiatAmountTile'

interface Props {
  navigation: NavigationProp<'stakeModify'>
  route: RouteProp<'stakeOverview'>
}

export const StakeOverviewScene = (props: Props) => {
  const { navigation } = props
  const { stakePolicy, stakePlugin, walletId } = props.route.params
  const { stakePolicyId } = stakePolicy
  const dispatch = useDispatch()
  const theme = useTheme()
  const styles = getStyles(theme)

  const account = useSelector(state => state.core.account)
  const wallet = account.currencyWallets[walletId]

  const displayDenomMap = [...stakePolicy.stakeAssets, ...stakePolicy.rewardAssets].reduce((denomMap, asset) => {
    // @ts-expect-error
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
  }, [wallet, stakePolicyId, updateCounter, stakePlugin])

  // Handlers
  const handleModifyPress = (modification: ChangeQuoteRequest['action']) => () => {
    if (stakePosition != null && stakeAllocations != null && rewardAllocations != null) {
      navigation.navigate('stakeModify', { stakePlugin, walletId, stakePolicy, stakePosition, modification })
    }
  }

  // Renderers
  // @ts-expect-error
  const renderCFAT = ({ item }) => {
    const { allocationType, currencyCode, nativeAmount } = item
    const titleBase = allocationType === 'staked' ? s.strings.stake_s_staked : s.strings.stake_s_earned
    const title = `${sprintf(titleBase, currencyCode)} ${getAllocationLocktimeMessage(item)}`
    // @ts-expect-error
    const denomination = displayDenomMap[currencyCode]

    const tokenId = guessFromCurrencyCode(account, { currencyCode, pluginId: wallet.currencyInfo.pluginId }).tokenId
    return <CryptoFiatAmountTile title={title} nativeCryptoAmount={nativeAmount ?? '0'} tokenId={tokenId} denomination={denomination} walletId={walletId} />
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

  const estimatedReturnMsg = stakePolicy.apy > 0 ? toFixed(stakePolicy.apy.toString(), 1, 1) + '% APR' : 'N/A'
  return (
    <SceneWrapper scroll background="theme">
      {sceneHeader}
      <View style={styles.card}>
        <StakingReturnsCard
          fromCurrencyLogos={policyIcons.stakeAssetUris}
          toCurrencyLogos={policyIcons.rewardAssetUris}
          text={sprintf(s.strings.stake_estimated_return, estimatedReturnMsg)}
          stakeProviderInfo={stakePolicy.stakeProviderInfo}
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
