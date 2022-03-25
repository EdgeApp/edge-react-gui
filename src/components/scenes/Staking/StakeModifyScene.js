// @flow
import { bns } from 'biggystring'
import * as React from 'react'
import { sprintf } from 'sprintf-js'

import s from '../../../locales/strings.js'
import { Slider } from '../../../modules/UI/components/Slider/Slider.js'
import { type ChangeQuote, type StakeDetails, makeStakePlugin } from '../../../plugins/stake-plugins'
import { getDisplayDenomination, getExchangeDenomination } from '../../../selectors/DenominationSelectors.js'
import { useEffect, useState } from '../../../types/reactHooks.js'
import { useSelector } from '../../../types/reactRedux'
import type { RouteProp } from '../../../types/routerTypes'
import { getCurrencyIcon } from '../../../util/CurrencyInfoHelpers.js'
import { getWalletFiat } from '../../../util/CurrencyWalletHelpers.js'
import { getAllocations, getRewardAllocation, getRewardAssetsName, getStakeAllocation, getStakeAssetsName, getStakeDetails } from '../../../util/stakeUtils.js'
import { SceneWrapper } from '../../common/SceneWrapper.js'
import { FlipInputModal } from '../../modals/FlipInputModal.js'
import { Airship } from '../../services/AirshipInstance.js'
import { cacheStyles, useTheme } from '../../services/ThemeContext.js'
import { Alert } from '../../themed/Alert.js'
import { CryptoFiatAmountTile } from '../../themed/CryptoFiatAmountTile.js'
import { EdgeText } from '../../themed/EdgeText.js'
import { EditableAmountTile } from '../../themed/EditableAmountTile.js'
import { IconTile } from '../../themed/IconTile'
import { SceneHeader } from '../../themed/SceneHeader.js'
import { Tile } from '../../themed/Tile.js'

type Props = {
  route: RouteProp<'stakeModify'>
}

// TODO: Use a plugin instance stored in the plugin-management system
const stakePlugin = makeStakePlugin()

export const StakeModifyScene = (props: Props) => {
  // Constants
  const { walletId, stakePolicy, allocationToMod, modification } = props.route.params
  const { stakePolicyId } = stakePolicy
  // TODO: Remove hard-coding for single asset to support multiple stake/reward assets
  const stakeAssetsName = getStakeAssetsName(stakePolicy)
  const rewardAssetsName = getRewardAssetsName(stakePolicy)

  // Hooks
  const {
    currencyWallet,
    guiExchangeRates,
    isoFiatCurrencyCode,

    stakeDisplayDenom,
    stakeExchangeDenom,
    rewardDisplayDenom,
    rewardExchangeDenom,
    nativeAssetDenomination
  } = useSelector(state => {
    const { currencyWallets } = state.core.account
    const currencyWallet = currencyWallets[walletId]
    const guiExchangeRates = state.exchangeRates

    // TODO: not needed?
    const walletPluginId = currencyWallet.currencyInfo.pluginId
    const stakeDisplayDenom = getDisplayDenomination(state, walletPluginId, stakeAssetsName)
    const stakeExchangeDenom = getExchangeDenomination(state, walletPluginId, stakeAssetsName)
    const rewardDisplayDenom = getDisplayDenomination(state, walletPluginId, rewardAssetsName)
    const rewardExchangeDenom = getExchangeDenomination(state, walletPluginId, rewardAssetsName)

    const nativeAssetDenomination = getDisplayDenomination(state, walletPluginId, currencyWallet.currencyInfo.currencyCode)
    const isoFiatCurrencyCode = getWalletFiat(currencyWallet).isoFiatCurrencyCode
    return {
      currencyWallet,
      guiExchangeRates,
      isoFiatCurrencyCode,

      // TODO: not needed?
      stakeDisplayDenom,
      stakeExchangeDenom,
      rewardDisplayDenom,
      rewardExchangeDenom,
      nativeAssetDenomination
    }
  })

  // Current Allocation Info
  const [nativeAllocationAmount, setNativeAllocationAmount] = useState()
  const [nativeRewardAmount, setNativeRewardAmount] = useState('0')
  const [stakeDetails: StakeDetails, setStakeDetails] = useState()
  useEffect(() => {
    getStakeDetails(stakePlugin, stakePolicyId, currencyWallet)
      .then(stakeDetails => {
        setStakeDetails(stakeDetails)
        const modificationMap = {
          stake: ['stake'],
          claim: ['earned'],
          unstake: ['stake', 'earned']
        }
        return modificationMap.map(allocationType => getAllocations(stakeDetails, modificationMap[allocationType]))
      })
      .then(detailAllocations => {
        setNativeAllocationAmount(detailAllocations[0])
      })
  }, [currencyWallet, modification, stakePolicyId])

  // Handlers
  const [pendingChangeQuote, setPendingChangeQuote] = useState()
  const [nativeModAmount, setNativeModAmount] = useState('0')
  const [nativeFeeAmount, setNativeFeeAmount] = useState('0')

  const onAmountEdited = (flipNativeAmount: string, displayModAmount: string) => {
    if (!bns.eq(nativeModAmount, flipNativeAmount)) {
      setNativeModAmount(flipNativeAmount)

      // Setup the request
      stakePlugin
        .fetchChangeQuote({
          action: modification,
          stakePolicyId: stakePolicyId,
          tokenId: allocationToMod?.tokenId ?? '',
          nativeAmount: flipNativeAmount,
          wallet: currencyWallet
        })
        .then(changeQuote => {
          setPendingChangeQuote(changeQuote)
          setNativeFeeAmount(changeQuote.allocations.find(allocation => allocation.allocationType === 'fee')?.nativeAmount)
        })
    }
  }

  const onMaxButtonPress = () => {
    // Allocation to modify is in native currency
    if (currencyWallet.currencyInfo.currencyCode === stakeAssetsName) {
      // TODO: V2
    } else {
      // TODO: V1
    }
  }

  // Renderers
  const theme = useTheme()
  const styles = getStyles(theme)

  const showFlipInputModal = () => {
    Airship.show(bridge => (
      <FlipInputModal bridge={bridge} walletId={walletId} currencyCode={stakeAssetsName} onAmountChanged={onAmountEdited} onMaxSet={onMaxButtonPress} />
    )).catch(error => console.log(error))
  }

  const isClaim = modification === 'claim'
  const renderEditableAmount = (modToRender: string, stakeDetails: StakeDetails) => {
    if (stakeDetails !== null) {
      const titleMap = {
        stake: s.strings.stake_amount_stake,
        claim: s.strings.stake_amount_claim,
        unstake: s.strings.stake_amount_unstake
      }

      const nativeAmountMap = {
        stake: nativeModAmount,
        claim: stakeDetails === null ? '0' : getRewardAllocation(stakeDetails),
        unstake: nativeModAmount
      }

      const amountCurrencyCode = isClaim ? rewardAssetsName : stakeAssetsName
      const exchangeDenomination = isClaim ? rewardExchangeDenom : stakeExchangeDenom
      const displayDenomination = isClaim ? rewardDisplayDenom : stakeDisplayDenom

      return (
        <EditableAmountTile
          title={titleMap[modToRender]}
          exchangeRates={guiExchangeRates}
          nativeAmount={nativeAmountMap[modToRender]}
          currencyWallet={currencyWallet}
          currencyCode={amountCurrencyCode}
          exchangeDenomination={exchangeDenomination}
          displayDenomination={displayDenomination}
          lockInputs={isClaim}
          onPress={showFlipInputModal}
        />
      )
    }
  }

  // Stake/Claim/Unstake-Mapped vars
  const sceneTitleMap = {
    stake: sprintf(s.strings.stake_x_to_earn_y, stakeAssetsName, rewardAssetsName),
    claim: s.strings.stake_claim_rewards,
    unstake: s.strings.stake_claim_unstake
  }

  const renderWarning = () => {
    if (!isClaim) return null
    return <Alert marginTop={0.5} title={s.strings.wc_smartcontract_warning_title} message={s.strings.stake_warning_claim} numberOfLines={0} type="warning" />
  }

  const amountTiles = stakeDetails !== null ? renderEditableAmount(modification, stakeDetails) : null
  const renderAmountTiles = (modAllocation, nativeAmount, modification) => {
    return (
      <>
        <Tile type="static" title={sceneTitleMap[modification]}>
          <IconTile title={s.strings.wc_smartcontract_wallet} iconUri={getCurrencyIcon(currencyWallet.currencyInfo.pluginId).symbolImage}>
            <EdgeText>{currencyWallet.name}</EdgeText>
          </IconTile>
        </Tile>
        {amountTiles}
        <CryptoFiatAmountTile
          title={s.strings.wc_smartcontract_network_fee}
          nativeCryptoAmount={nativeFeeAmount}
          style={styles.lastTile}
          cryptoCurrencyCode={currencyWallet.currencyInfo.currencyCode}
          isoFiatCurrencyCode={isoFiatCurrencyCode}
          denomination={nativeAssetDenomination}
        />
        {renderWarning()}
        <Slider
          onSlidingComplete={() => {
            if (pendingChangeQuote.approve !== null) pendingChangeQuote.approve()
          }}
          disabled={false}
          showSpinner={null}
          disabledText={s.strings.fio_address_confirm_screen_disabled_slider_label}
        />
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
