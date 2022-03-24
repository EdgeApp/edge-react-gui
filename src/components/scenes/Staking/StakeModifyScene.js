// @flow
import { bns } from 'biggystring'
import * as React from 'react'
import { sprintf } from 'sprintf-js'

import s from '../../../locales/strings.js'
import { Slider } from '../../../modules/UI/components/Slider/Slider.js'
import { type ChangeQuote, type StakeDetails, makeStakePlugin } from '../../../plugins/stake-plugins/index.js'
import { type AllocationType } from '../../../plugins/stake-plugins/types'
import { getDisplayDenomination, getExchangeDenomination } from '../../../selectors/DenominationSelectors.js'
import { useEffect, useState } from '../../../types/reactHooks.js'
import { useSelector } from '../../../types/reactRedux'
import type { RouteProp } from '../../../types/routerTypes'
import { getCurrencyIcon } from '../../../util/CurrencyInfoHelpers.js'
import { getWalletFiat } from '../../../util/CurrencyWalletHelpers.js'
import { getRewardAllocation, getRewardAssetsName, getStakeAssetsName, getStakeDetails } from '../../../util/stakeUtils.js'
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
  const [stakeDetails: StakeDetails, setStakeDetails] = useState({
    allocations: []
  })
  const [rewardAmount: string, setRewardAmount] = useState('0')
  useEffect(() => {
    getStakeDetails(stakePlugin, stakePolicyId, currencyWallet).then(stakeDetails => {
      setStakeDetails(stakeDetails)
      getRewardAllocation(stakeDetails).then(rewardAllocation => {
        setRewardAmount(rewardAllocation === null ? '0' : rewardAllocation.nativeAmount)
      })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currencyWallet, modification, stakePolicyId])

  // Handlers
  const [pendingChangeQuote: ChangeQuote, setPendingChangeQuote] = useState({ allocations: [], approve: () => {} })
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
          setNativeFeeAmount(changeQuote.allocations.find(allocation => allocation.allocationType === 'fee')?.nativeAmount ?? '0')
        })
    }
  }

  const onMaxButtonPress = () => {
    // Allocation to modify is in native currency
    if (currencyWallet.currencyInfo.currencyCode === allocationToMod?.tokenId) {
      // TODO: (V2) Set max amount minus fees if specifying native asset amount
    } else {
      if (modification === 'unstake') {
        setNativeModAmount(allocationToMod?.nativeAmount ?? '0')
      }
      // TODO: Get token amounts from currencyWallet
      // else if (modification === 'stake')
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
  const renderEditableAmount = (allocationType: AllocationType, stakeDetails: StakeDetails) => {
    console.log('\x1b[34m\x1b[43m' + `allocationType: ${JSON.stringify(allocationType, null, 2)}` + '\x1b[0m')
    if (stakeDetails !== null) {
      const titleMap = {
        stake: s.strings.stake_amount_stake,
        claim: s.strings.stake_amount_claim,
        unstake: s.strings.stake_amount_unstake,
        fee: ''
      }

      const nativeAmountMap = {
        stake: nativeModAmount,
        claim: rewardAmount,
        unstake: nativeModAmount,
        fee: ''
      }

      const amountCurrencyCodeMap = {
        stake: stakeAssetsName,
        claim: rewardAssetsName,
        unstake: stakeAssetsName,
        fee: ''
      }

      const exchangeDenomMap = {
        stake: stakeExchangeDenom,
        claim: rewardExchangeDenom,
        unstake: stakeExchangeDenom,
        fee: stakeExchangeDenom
      }

      const displayDenomMap = {
        stake: stakeDisplayDenom,
        claim: rewardDisplayDenom,
        unstake: stakeDisplayDenom,
        fee: stakeDisplayDenom
      }

      return (
        <EditableAmountTile
          title={titleMap[allocationType]}
          exchangeRates={guiExchangeRates}
          nativeAmount={nativeAmountMap[allocationType]}
          currencyWallet={currencyWallet}
          currencyCode={amountCurrencyCodeMap[allocationType]}
          exchangeDenomination={exchangeDenomMap[allocationType]}
          displayDenomination={displayDenomMap[allocationType]}
          lockInputs={isClaim}
          onPress={showFlipInputModal}
        />
      )
    }
  }

  const renderWarning = () => {
    if (!isClaim) return null
    return <Alert marginTop={0.5} title={s.strings.wc_smartcontract_warning_title} message={s.strings.stake_warning_claim} numberOfLines={0} type="warning" />
  }

  const displayAllocationTypesMap = {
    stake: ['stake'],
    claim: ['claim'],
    unstake: ['claim', 'stake']
  }
  const renderAmountTiles = (modAllocation, nativeAmount, modification) => {
    return (
      <>
        <IconTile title={s.strings.wc_smartcontract_wallet} iconUri={getCurrencyIcon(currencyWallet.currencyInfo.pluginId).symbolImage}>
          <EdgeText>{currencyWallet.name}</EdgeText>
        </IconTile>
        {displayAllocationTypesMap[modification].map(allocationType => renderEditableAmount(allocationType, stakeDetails))}
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

  const sceneTitleMap = {
    stake: sprintf(s.strings.stake_x_to_earn_y, stakeAssetsName, rewardAssetsName),
    claim: s.strings.stake_claim_rewards,
    unstake: s.strings.stake_claim_unstake
  }
  return (
    <SceneWrapper background="theme">
      <SceneHeader style={styles.sceneHeader} title={sceneTitleMap[modification]} underline withTopMargin />
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
