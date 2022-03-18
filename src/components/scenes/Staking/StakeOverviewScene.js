// @flow
import { toFixed } from 'biggystring'
import * as React from 'react'
import { View } from 'react-native'
import { Button } from 'react-native-share'
import { sprintf } from 'sprintf-js'

import s from '../../../locales/strings.js'
import { getDisplayDenomination } from '../../../selectors/DenominationSelectors.js'
import { useEffect, useState } from '../../../types/reactHooks.js'
import { useSelector } from '../../../types/reactRedux'
import type { RouteProp } from '../../../types/routerTypes'
import { type NavigationProp } from '../../../types/routerTypes.js'
import { getCurrencyIcon } from '../../../util/CurrencyInfoHelpers.js'
import { getWalletFiat } from '../../../util/CurrencyWalletHelpers.js'
import {
  getRewardAllocation,
  getRewardAssetsName,
  getStakeAllocation,
  getStakeAssetsName,
  getStakeDetails,
  getStakePolicyById
} from '../../../util/stakeUtils.js'
import { SceneWrapper } from '../../common/SceneWrapper.js'
import { cacheStyles, useTheme } from '../../services/ThemeContext.js'
import { CryptoFiatAmountTile } from '../../themed/CryptoFiatAmountTile.js'
import { MainButton } from '../../themed/MainButton.js'
import { SceneHeader } from '../../themed/SceneHeader.js'
import { StakingReturnsCard } from '../../themed/StakingReturnsCard.js'
import { getFakeStakePlugin } from './StakeApi.js'

type Props = {
  navigation: NavigationProp<'stakeModify'>,
  route: RouteProp<'stakeOverview'>
}

// TODO: Hack for V1/V2 where we only have one plugin.
const stakePlugin = getFakeStakePlugin()

export const StakeOverviewScene = (props: Props) => {
  const { navigation } = props
  const { walletId, stakePolicy } = props.route.params
  const { stakePolicyId } = stakePolicy
  const theme = useTheme()
  const styles = getStyles(theme)

  // TODO: Remove hard-coding for single asset to support multiple stake/reward assets
  const stakeAssetsName = getStakeAssetsName(stakePolicy)
  const rewardAssetsName = getRewardAssetsName(stakePolicy)

  const { currencyWallet, walletPluginId, stakeAssetsDenomination, rewardAssetDenomination, isoFiatCurrencyCode } = useSelector(state => {
    const { currencyWallets } = state.core.account
    const currencyWallet = currencyWallets[walletId]
    const walletPluginId = currencyWallet.currencyInfo.pluginId
    const stakeAssetsDenomination = getDisplayDenomination(state, walletPluginId, stakeAssetsName)
    const rewardAssetDenomination = getDisplayDenomination(state, walletPluginId, rewardAssetsName)
    const isoFiatCurrencyCode = getWalletFiat(currencyWallet).isoFiatCurrencyCode
    return { currencyWallet, walletPluginId, stakeAssetsDenomination, rewardAssetDenomination, isoFiatCurrencyCode }
  })
  const metaTokens = currencyWallet.currencyInfo.metaTokens
  const stakeContractAddress = metaTokens.find(token => token.currencyCode === stakeAssetsName)?.contractAddress
  const rewardContractAddress = metaTokens.find(token => token.currencyCode === rewardAssetsName)?.contractAddress
  const stakeImages = [getCurrencyIcon(walletPluginId, stakeContractAddress).symbolImage]
  const rewardImages = [getCurrencyIcon(walletPluginId, rewardContractAddress).symbolImage]

  const [stakeAllocation, setStakeAllocation] = useState()
  const [rewardAllocation, setRewardAllocation] = useState()

  useEffect(() => {
    async function fetchStakeDetails() {
      const stakeAllocation = await getStakeAllocation(stakePlugin, stakePolicyId, currencyWallet)
      const rewardAllocation = await getRewardAllocation(stakePlugin, stakePolicyId, currencyWallet)
      return { stakeAllocation, rewardAllocation }
    }

    fetchStakeDetails().then(({ stakeAllocation, rewardAllocation }) => {
      setStakeAllocation(stakeAllocation)
      setRewardAllocation(rewardAllocation)
    })
  }, [currencyWallet, stakePolicyId])

  return (
    <SceneWrapper background="theme">
      <SceneHeader style={styles.sceneHeader} title={stakeAssetsName} underline withTopMargin />
      <View style={styles.card}>
        <StakingReturnsCard
          fromCurrencyLogos={stakeImages}
          toCurrencyLogos={rewardImages}
          text={`Estimated Return: ${toFixed(stakePolicy.apy.toString(), 1, 1)}% APR`}
        />
      </View>
      <CryptoFiatAmountTile
        title="Currently Staked"
        nativeCryptoAmount={stakeAllocation?.nativeAmount ?? ''}
        cryptoCurrencyCode={stakeAssetsName}
        isoFiatCurrencyCode={isoFiatCurrencyCode}
        denomination={stakeAssetsDenomination}
      />
      <CryptoFiatAmountTile
        title={`${rewardAssetsName} Earned`}
        nativeCryptoAmount={rewardAllocation?.nativeAmount ?? ''}
        cryptoCurrencyCode={rewardAssetsName}
        isoFiatCurrencyCode={isoFiatCurrencyCode}
        denomination={rewardAssetDenomination}
      />
      <MainButton
        label="Stake More Funds"
        type="primary"
        onPress={() => {
          console.log('\x1b[34m\x1b[43m' + `'stake': ${JSON.stringify('stake', null, 2)}` + '\x1b[0m')
          navigation.navigate('stakeModify', { walletId, stakePolicy, allocationToMod: stakeAllocation, modification: 'stake' })
        }}
        marginRem={0.5}
      />
      <MainButton
        label="Claim Rewards"
        type="secondary"
        onPress={() => {
          navigation.navigate('stakeModify', { walletId, stakePolicy, allocationToMod: rewardAllocation, modification: 'claim' })
        }}
        marginRem={0.5}
      />
      <MainButton
        label="Unstake"
        type="secondary"
        onPress={() => {
          navigation.navigate('stakeModify', { walletId, stakePolicy, allocationToMod: stakeAllocation, modification: 'unstake' })
        }}
        marginRem={0.5}
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
  currencyLogo: {
    height: theme.rem(1.25),
    width: theme.rem(1.25),
    resizeMode: 'contain',
    marginLeft: theme.rem(1)
  },
  explainer: {
    margin: theme.rem(0.5)
  },
  amountText: {
    fontSize: theme.rem(2)
  },
  sliderContainer: {
    paddingVertical: theme.rem(2)
  },
  errorMessage: {
    color: theme.dangerText
  },
  estReturn: {
    padding: theme.rem(0.75),
    marginTop: theme.rem(1),
    marginHorizontal: theme.rem(2.5),
    borderWidth: theme.thinLineWidth,
    borderColor: theme.cardBorderColor,
    borderRadius: theme.rem(0.5),
    alignItems: 'center',
    justifyContent: 'center'
  }
}))
