// @flow
import * as React from 'react'

import s from '../../../locales/strings.js'
import { makeStakePlugin } from '../../../plugins/stake-plugins/index.js'
import { getDisplayDenomination, getExchangeDenomination } from '../../../selectors/DenominationSelectors.js'
import { useEffect, useState } from '../../../types/reactHooks.js'
import { useSelector } from '../../../types/reactRedux'
import type { RouteProp } from '../../../types/routerTypes'
import { getCurrencyIcon } from '../../../util/CurrencyInfoHelpers.js'
import { getWalletFiat } from '../../../util/CurrencyWalletHelpers.js'
import { getRewardAllocation, getRewardAssetsName, getStakeAllocation, getStakeAssetsName } from '../../../util/stakeUtils.js'
import { SceneWrapper } from '../../common/SceneWrapper.js'
import { cacheStyles, useTheme } from '../../services/ThemeContext.js'
import { Card } from '../../themed/Card.js'
import { CryptoFiatAmountTile } from '../../themed/CryptoFiatAmountTile.js'
import { EditableAmountTile } from '../../themed/EditableAmountTile.js'
import { SceneHeader } from '../../themed/SceneHeader.js'

type Props = {
  // navigation: NavigationProp<'stakeModify'>,
  route: RouteProp<'stakeModify'>
}

// TODO: Use a plugin instance stored in the plugin-management system
const stakePlugin = makeStakePlugin()

export const StakeModifyScene = (props: Props) => {
  const { walletId, stakePolicy, allocationToMod, modification } = props.route.params
  const { stakePolicyId } = stakePolicy
  const theme = useTheme()
  const styles = getStyles(theme)

  // TODO: Remove hard-coding for single asset to support multiple stake/reward assets
  const stakeAssetsName = getStakeAssetsName(stakePolicy)
  const rewardAssetsName = getRewardAssetsName(stakePolicy)

  const {
    currencyWallet,
    walletPluginId,
    guiExchangeRates,
    stakeDisplayDenom,
    stakeExchangeDenom,
    rewardDisplayDenom,
    rewardExchangeDenom,
    nativeAssetDenomination,
    isoFiatCurrencyCode
  } = useSelector(state => {
    const { currencyWallets } = state.core.account
    const currencyWallet = currencyWallets[walletId]
    const walletPluginId = currencyWallet.currencyInfo.pluginId
    const guiExchangeRates = state.exchangeRates
    const stakeDisplayDenom = getDisplayDenomination(state, walletPluginId, stakeAssetsName)
    const stakeExchangeDenom = getExchangeDenomination(state, walletPluginId, stakeAssetsName)
    const rewardDisplayDenom = getDisplayDenomination(state, walletPluginId, rewardAssetsName)
    const rewardExchangeDenom = getExchangeDenomination(state, walletPluginId, rewardAssetsName)

    const nativeAssetDenomination = getDisplayDenomination(state, walletPluginId, currencyWallet.currencyInfo.currencyCode)
    const isoFiatCurrencyCode = getWalletFiat(currencyWallet).isoFiatCurrencyCode
    return {
      currencyWallet,
      walletPluginId,
      guiExchangeRates,
      stakeDisplayDenom,
      stakeExchangeDenom,
      rewardDisplayDenom,
      rewardExchangeDenom,
      nativeAssetDenomination,
      isoFiatCurrencyCode
    }
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

  const renderWalletSelect = () => {
    // if (selectedWallet.walletId === '' && selectedWallet.currencyCode === '') {
    //   return <SelectableRow onPress={showWalletListModal} title={s.strings.wc_confirm_select_wallet} arrowTappable />
    // } else {
    //   const walletNameStr = truncateString(walletName || '', MAX_ADDRESS_CHARACTERS)
    //   const walletImage = <FastImage style={styles.currencyLogo} source={{ uri: walletImageUri }} />
    //   const walletAddressStr = truncateString(JSON.stringify(walletAddress), MAX_ADDRESS_CHARACTERS, true)
    //   return <SelectableRow onPress={showWalletListModal} icon={walletImage} title={walletNameStr} subTitle={walletAddressStr} arrowTappable />
    // }
  }

  const titleMap = {
    stake: 'Amount to Stake',
    claim: 'Amount of reward to claim',
    unstake: 'Amount to Unstake'
  }
  const renderAmountTiles = (allocationToMod, modification) => {
    const isClaim = modification === 'claim'
    const amountCurrencyCode = isClaim ? rewardAssetsName : stakeAssetsName
    const exchangeDenomination = isClaim ? rewardExchangeDenom : stakeExchangeDenom
    const displayDenomination = isClaim ? rewardDisplayDenom : stakeDisplayDenom
    return (
      <>
        <Card paddingRem={0} marginRem={[2.5, 0.5, 2]}>
          {/* {renderWalletSelect()} */}
        </Card>
        <EditableAmountTile
          title={titleMap[modification]}
          exchangeRates={guiExchangeRates}
          nativeAmount={allocationToMod?.nativeAmount ?? '0'}
          currencyWallet={currencyWallet}
          currencyCode={amountCurrencyCode}
          exchangeDenomination={exchangeDenomination}
          displayDenomination={displayDenomination}
          lockInputs={isClaim}
          onPress={() => {}}
        />
        <CryptoFiatAmountTile
          title={s.strings.wc_smartcontract_network_fee}
          nativeCryptoAmount={'0' /** TODO */}
          cryptoCurrencyCode={currencyWallet.currencyInfo.currencyCode}
          isoFiatCurrencyCode={isoFiatCurrencyCode}
          denomination={nativeAssetDenomination}
        />
      </>
    )
  }

  return (
    /**
     * Header:
     * S: Stake S to earn R
     * C: Claim Rewards [R icon]
     * U: Unstake S [S icon]
     *
     ******************
     * Body:
     * S: *'Stake your coins to earn passive income on your funds
     *    
     *    Staked coins are unusable for the duration of the stake'
     * 
     *    Wallet
     *    EAT (Amount to stake)
     *    Network Fee Tile
     *
     * C: 
     *    Wallet
     *    EAT (Amount of reward to claim)
     *    Network Fee Tile
     * 
     *    * Warning: 
     *      Claiming rewards will block you from withdrawing your staked funds for 36 hours. 

          To claim rewards AND unstake any staked funds, choose “claim rewards and unstake” instead.
     * 
     * U: 
     *    Wallet
     *    EAT (Amount to Unstake)
     *    Network Fee Tile
     ******************
     * ALL: Slider
     */

    <SceneWrapper background="theme">
      <SceneHeader style={styles.sceneHeader} title={`Stake ${stakeAssetsName} to earn ${rewardAssetsName}`} underline withTopMargin />
      {renderAmountTiles(allocationToMod, modification)}
      {/* <StakingReturnsCard
        fromCurrencyLogos={stakeImages}
        toCurrencyLogos={rewardImages}
        text={`Estimated Return: ${toFixed(stakePolicy.apy.toString(), 1, 1)}`}
      />
      <CryptoFiatAmountTile
        title="Currently Staked"
        nativeCryptoAmount={stakeAllocation?.nativeAmount ?? ''}
        cryptoCurrencyCode={stakeAssetsName}
        isoFiatCurrencyCode={isoFiatCurrencyCode}
        denomination={stakeDisplayDenom}
      />
      <CryptoFiatAmountTile
        title={`${rewardAssetsName} Earned`}
        nativeCryptoAmount={rewardAllocation?.nativeAmount ?? ''}
        cryptoCurrencyCode={rewardAssetsName}
        isoFiatCurrencyCode={isoFiatCurrencyCode}
        denomination={rewardDisplayDenom}
      />
      <MainButton label="Stake More Funds" type="primary" onPress={() => {}} marginRem={0.5} />
      <MainButton label="Claim Rewards" type="secondary" onPress={() => {}} marginRem={0.5} />
      <MainButton label="Unstake" type="secondary" onPress={() => {}} marginRem={0.5} /> */}
    </SceneWrapper>
  )
}

const getStyles = cacheStyles(theme => ({
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
