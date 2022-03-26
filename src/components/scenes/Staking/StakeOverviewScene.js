// @flow
import { toFixed } from 'biggystring'
import * as React from 'react'
import { View } from 'react-native'
import { sprintf } from 'sprintf-js'

import s from '../../../locales/strings.js'
import { type ChangeQuoteRequest, type DetailAllocation, type StakePolicy, makeStakePlugin } from '../../../plugins/stake-plugins'
import type { RootState } from '../../../reducers/RootReducer.js'
import { getDisplayDenomination } from '../../../selectors/DenominationSelectors.js'
import { useEffect, useState } from '../../../types/reactHooks.js'
import { useSelector } from '../../../types/reactRedux'
import type { RouteProp } from '../../../types/routerTypes'
import { type NavigationProp } from '../../../types/routerTypes.js'
import { getCurrencyIcon } from '../../../util/CurrencyInfoHelpers.js'
import { getWalletFiat } from '../../../util/CurrencyWalletHelpers.js'
import { getAllocationLocktimeMessage, getRewardAllocation, getRewardAssetNames, getStakeAllocation, getStakeAssetNames } from '../../../util/stakeUtils.js'
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

// TODO: Use a plugin instance stored in the plugin-management system
const stakePlugin = makeStakePlugin()

export const StakeOverviewScene = (props: Props) => {
  const { navigation } = props
  const { walletId } = props.route.params
  const stakePolicy: StakePolicy = props.route.params.stakePolicy
  const { stakePolicyId } = stakePolicy
  const theme = useTheme()
  const styles = getStyles(theme)

  // TODO: Remove hard-coding for single asset to support multiple stake/reward assets
  const stakeAssetsName = getStakeAssetNames(stakePolicy)[0]
  const rewardAssetsName = getRewardAssetNames(stakePolicy)[0]

  const { currencyWallet, walletPluginId, stakeAssetsDenomination, rewardAssetDenomination, isoFiatCurrencyCode } = useSelector((state: RootState) => {
    const { currencyWallets } = state.core.account
    const currencyWallet = currencyWallets[walletId]
    const walletPluginId = currencyWallet.currencyInfo.pluginId
    const stakeAssetsDenomination = getDisplayDenomination(state, walletPluginId, stakeAssetsName)
    const rewardAssetsDenomination = getDisplayDenomination(state, walletPluginId, rewardAssetsName)
    const isoFiatCurrencyCode = getWalletFiat(currencyWallet).isoFiatCurrencyCode
    return { currencyWallet, walletPluginId, stakeAssetsDenomination, rewardAssetDenomination: rewardAssetsDenomination, isoFiatCurrencyCode }
  })
  const metaTokens = currencyWallet.currencyInfo.metaTokens
  const stakeContractAddress = metaTokens.find(token => token.currencyCode === stakeAssetsName)?.contractAddress
  const rewardContractAddress = metaTokens.find(token => token.currencyCode === rewardAssetsName)?.contractAddress
  const stakeImages = [getCurrencyIcon(walletPluginId, stakeContractAddress).symbolImage]
  const rewardImages = [getCurrencyIcon(walletPluginId, rewardContractAddress).symbolImage]

  const [stakeAllocation, setStakeAllocation] = useState<DetailAllocation | void>()
  const [rewardAllocation, setRewardAllocation] = useState<DetailAllocation | void>()

  useEffect(() => {
    stakePlugin
      .fetchStakeDetails({ stakePolicyId, wallet: currencyWallet })
      .then(async stakeDetails => {
        const stakeAllocation = await getStakeAllocation(stakeDetails)
        const rewardAllocation = await getRewardAllocation(stakeDetails)
        setStakeAllocation(stakeAllocation)
        setRewardAllocation(rewardAllocation)
      })
      .catch(err => {
        console.error(err)
      })
  }, [currencyWallet, stakePolicyId])

  const handleModifyPress = (modification: $PropertyType<ChangeQuoteRequest, 'action'>) => () => {
    if (stakeAllocation != null) {
      navigation.navigate('stakeModify', { walletId, stakePolicy, allocationToMod: stakeAllocation, modification })
    }
  }

  if (stakeAllocation == null || rewardAllocation == null)
    return (
      <SceneWrapper background="theme">
        <FillLoader />
      </SceneWrapper>
    )

  return (
    <SceneWrapper background="theme">
      <SceneHeader style={styles.sceneHeader} title={sprintf(s.strings.stake_x_to_earn_y, stakeAssetsName, rewardAssetsName)} underline withTopMargin />
      <View style={styles.card}>
        <StakingReturnsCard
          fromCurrencyLogos={stakeImages}
          toCurrencyLogos={rewardImages}
          text={sprintf(s.strings.stake_estimated_return, toFixed(stakePolicy.apy.toString(), 1, 1))}
        />
      </View>
      <CryptoFiatAmountTile
        title={s.strings.stake_currently_staked + getAllocationLocktimeMessage(stakeAllocation)}
        nativeCryptoAmount={stakeAllocation.nativeAmount ?? ''}
        cryptoCurrencyCode={stakeAssetsName}
        isoFiatCurrencyCode={isoFiatCurrencyCode}
        denomination={stakeAssetsDenomination}
      />
      <CryptoFiatAmountTile
        title={sprintf(s.strings.stake_earned, rewardAssetsName) + getAllocationLocktimeMessage(rewardAllocation)}
        nativeCryptoAmount={rewardAllocation.nativeAmount ?? ''}
        cryptoCurrencyCode={rewardAssetsName}
        isoFiatCurrencyCode={isoFiatCurrencyCode}
        denomination={rewardAssetDenomination}
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
