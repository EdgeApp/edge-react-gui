// @flow
import { add, bns } from 'biggystring'
import * as React from 'react'
import { View } from 'react-native'
import FastImage from 'react-native-fast-image'
import { sprintf } from 'sprintf-js'

import s from '../../../locales/strings.js'
import { Slider } from '../../../modules/UI/components/Slider/Slider.js'
import { type ChangeQuote, makeStakePlugin } from '../../../plugins/stake-plugins/index.js'
import { getDisplayDenomination, getExchangeDenomination } from '../../../selectors/DenominationSelectors.js'
import { useEffect, useState } from '../../../types/reactHooks.js'
import { useSelector } from '../../../types/reactRedux'
import type { RouteProp } from '../../../types/routerTypes'
import { getCurrencyIcon } from '../../../util/CurrencyInfoHelpers.js'
import { getWalletFiat } from '../../../util/CurrencyWalletHelpers.js'
import { getRewardAllocation, getRewardAssetsName, getStakeAllocation, getStakeAssetsName } from '../../../util/stakeUtils.js'
import { convertNativeToDenomination } from '../../../util/utils.js'
import { SceneWrapper } from '../../common/SceneWrapper.js'
import { FlipInputModal } from '../../modals/FlipInputModal.js'
import { Airship } from '../../services/AirshipInstance.js'
import { cacheStyles, useTheme } from '../../services/ThemeContext.js'
import { Alert } from '../../themed/Alert.js'
import { CryptoFiatAmountTile } from '../../themed/CryptoFiatAmountTile.js'
import { EdgeText } from '../../themed/EdgeText.js'
import { EditableAmountTile } from '../../themed/EditableAmountTile.js'
import { SceneHeader } from '../../themed/SceneHeader.js'
import { Tile } from '../../themed/Tile.js'

type Props = {
  route: RouteProp<'stakeModify'>
}

// TODO: Use a plugin instance stored in the plugin-management system
const stakePlugin = makeStakePlugin()

export const StakeModifyScene = (props: Props) => {
  const { walletId, stakePolicy, allocationToMod, modification } = props.route.params
  const { stakePolicyId } = stakePolicy
  const theme = useTheme()
  const styles = getStyles(theme)

  // TODO: Cleanup: Better case handling... Make component builders that only require allocation?
  const isClaim = modification === 'claim'

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

  const sceneTitleMap = {
    stake: sprintf(s.strings.stake_x_to_earn_y, stakeAssetsName, rewardAssetsName),
    claim: s.strings.stake_claim_rewards,
    unstake: s.strings.stake_claim_unstake
  }

  const amountTileTitleMap = {
    stake: s.strings.stake_amount_stake,
    claim: s.strings.stake_amount_claim,
    unstake: s.strings.stake_amount_unstake
  }

  const [pendingChangeQuote, setPendingChangeQuote] = useState()
  const [nativeModAmount, setNativeModAmount] = useState('0')
  const [nativeFeeAmount, setNativeFeeAmount] = useState('0')
  const onAmountChanged = (flipNativeAmount: string, displayModAmount: string) => {
    if (!bns.eq(nativeModAmount, flipNativeAmount)) {
      setNativeModAmount(flipNativeAmount)
      // Setup the request
      stakePlugin
        .fetchChangeQuote({
          action: modification,
          stakePolicyId: stakePolicyId,
          tokenId: allocationToMod.tokenId,
          nativeAmount: flipNativeAmount,
          wallet: currencyWallet
        })
        .then(changeQuote => {
          setPendingChangeQuote(changeQuote)
          const test = changeQuote.allocations.find(allocation => allocation.allocationType === 'fee').nativeAmount
          console.log('\x1b[34m\x1b[43m' + `test: ${JSON.stringify(test, null, 2)}` + '\x1b[0m')
          setNativeFeeAmount(test)
        })
    }
  }

  const onMaxSet = () => {
    // Allocation to modify is in native currency
    if (currencyWallet.currencyInfo.currencyCode === stakeAssetsName) {
      // TODO: V2
    } else {
      // TODO: V1
    }
  }

  const handleFlipInputModal = () => {
    Airship.show(bridge => (
      <FlipInputModal bridge={bridge} walletId={walletId} currencyCode={stakeAssetsName} onAmountChanged={onAmountChanged} onMaxSet={onMaxSet} />
    )).catch(error => console.log(error))
  }

  const renderWarning = () => {
    if (!isClaim) return null

    return <Alert marginTop={0.5} title={s.strings.wc_smartcontract_warning_title} message={s.strings.stake_warning_claim} numberOfLines={0} type="warning" />
  }

  const renderAmountTiles = (modAllocation, nativeAmount, modification) => {
    const amountCurrencyCode = isClaim ? rewardAssetsName : stakeAssetsName
    const exchangeDenomination = isClaim ? rewardExchangeDenom : stakeExchangeDenom
    const displayDenomination = isClaim ? rewardDisplayDenom : stakeDisplayDenom
    return (
      <>
        <Tile type="static" title={sceneTitleMap[modification]}>
          <View style={styles.walletContainer}>
            <FastImage style={styles.currencyLogo} source={{ uri: stakeImages[0] }} />
            <EdgeText>{currencyWallet.name}</EdgeText>
          </View>
        </Tile>
        <EditableAmountTile
          title={amountTileTitleMap[modification]}
          exchangeRates={guiExchangeRates}
          nativeAmount={nativeAmount ?? '0'}
          currencyWallet={currencyWallet}
          currencyCode={amountCurrencyCode}
          exchangeDenomination={exchangeDenomination}
          displayDenomination={displayDenomination}
          lockInputs={isClaim}
          onPress={handleFlipInputModal}
        />
        <CryptoFiatAmountTile
          title={s.strings.wc_smartcontract_network_fee}
          nativeCryptoAmount={nativeFeeAmount}
          style={styles.lastTile}
          cryptoCurrencyCode={currencyWallet.currencyInfo.currencyCode}
          isoFiatCurrencyCode={isoFiatCurrencyCode}
          denomination={nativeAssetDenomination}
        />
        {renderWarning()}
        <Slider onSlidingComplete={() => {}} disabled={false} showSpinner={null} disabledText={s.strings.fio_address_confirm_screen_disabled_slider_label} />
      </>
    )
  }

  return (
    <SceneWrapper background="theme">
      <SceneHeader style={styles.sceneHeader} title={`Stake ${stakeAssetsName} to earn ${rewardAssetsName}`} underline withTopMargin />
      {renderAmountTiles(allocationToMod, nativeModAmount, modification)}
    </SceneWrapper>
  )
}

const getStyles = cacheStyles(theme => ({
  walletContainer: {
    flexDirection: 'row'
  },
  currencyLogo: {
    height: theme.rem(1.25),
    width: theme.rem(1.25),
    resizeMode: 'contain',
    marginRight: theme.rem(0.5)
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
  lastTile: {
    marginBottom: theme.rem(0.5)
  }
}))
