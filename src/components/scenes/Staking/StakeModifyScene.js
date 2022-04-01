// @flow
import { bns } from 'biggystring'
import * as React from 'react'
import { View } from 'react-native'
import { sprintf } from 'sprintf-js'

import s from '../../../locales/strings.js'
import { Slider } from '../../../modules/UI/components/Slider/Slider.js'
import { type ChangeQuote, type QuoteAllocation, type StakeDetails } from '../../../plugins/stake-plugins'
import { getDisplayDenomination, getExchangeDenomination } from '../../../selectors/DenominationSelectors.js'
import { useEffect, useState } from '../../../types/reactHooks.js'
import { useSelector } from '../../../types/reactRedux'
import type { NavigationProp, RouteProp } from '../../../types/routerTypes'
import { getCurrencyIcon } from '../../../util/CurrencyInfoHelpers.js'
import { getWalletFiat } from '../../../util/CurrencyWalletHelpers.js'
import { getRewardAllocation, getRewardAssetsName, getStakeAllocation, getStakeAssetsName, stakePlugin } from '../../../util/stakeUtils.js'
import { zeroString } from '../../../util/utils.js'
import { FillLoader } from '../../common/FillLoader.js'
import { SceneWrapper } from '../../common/SceneWrapper.js'
import { FlipInputModal } from '../../modals/FlipInputModal.js'
import { FlashNotification } from '../../navigation/FlashNotification.js'
import { Airship, showError } from '../../services/AirshipInstance.js'
import { cacheStyles, useTheme } from '../../services/ThemeContext.js'
import { Alert } from '../../themed/Alert.js'
import { CryptoFiatAmountTile } from '../../themed/CryptoFiatAmountTile.js'
import { EdgeText } from '../../themed/EdgeText.js'
import { EditableAmountTile } from '../../themed/EditableAmountTile.js'
import { IconTile } from '../../themed/IconTile'
import { SceneHeader } from '../../themed/SceneHeader.js'

type Props = {
  navigation: NavigationProp<'stakeModify'>,
  route: RouteProp<'stakeModify'>
}

const DEFAULT = ''

export const StakeModifyScene = (props: Props) => {
  // Constants
  const { navigation } = props
  const { walletId, stakePolicy, stakeDetails, allocationToMod, modification } = props.route.params
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
      stakeDisplayDenom,
      stakeExchangeDenom,
      rewardDisplayDenom,
      rewardExchangeDenom,
      nativeAssetDenomination
    }
  })

  // Current Allocation Info
  const [rewardAmount, setRewardAmount] = useState<string>('0')

  // Handlers
  const [pendingChangeQuote, setPendingChangeQuote] = useState<ChangeQuote | void>()
  const [nativeModAmount, setNativeModAmount] = useState(DEFAULT)
  const [nativeFeeAmount, setNativeFeeAmount] = useState(DEFAULT)
  const [sliderLocked, setSliderLocked] = useState(false)

  // Get pending change quote
  useEffect(() => {
    if (zeroString(nativeModAmount)) return
    let abort = false
    // Setup the request
    stakePlugin
      .fetchChangeQuote({
        action: modification,
        stakePolicyId: stakePolicyId,
        tokenId: allocationToMod?.tokenId ?? '',
        nativeAmount: nativeModAmount,
        wallet: currencyWallet
      })
      .then(changeQuote => {
        if (abort) return
        setPendingChangeQuote(changeQuote)
        setNativeFeeAmount(changeQuote.allocations.find(allocation => allocation.allocationType === 'fee')?.nativeAmount ?? '0')
      })
      .catch(err => {
        if (abort) return
        showError(err.message)
      })
    return () => {
      abort = true
    }
  }, [modification, stakePolicyId, allocationToMod?.tokenId, nativeModAmount, currencyWallet])

  // Effect that initializes the allocation amount
  useEffect(() => {
    const rewardAllocation = getRewardAllocation(stakeDetails)
    const rewardAmountResult = rewardAllocation === null ? DEFAULT : rewardAllocation.nativeAmount
    const stakeAllocation = getStakeAllocation(stakeDetails)
    const stakeAmountResult = stakeAllocation === null ? DEFAULT : stakeAllocation.nativeAmount

    setRewardAmount(rewardAmountResult)

    if (modification === 'claim') updateNativeModAmount(rewardAmountResult)
    if (modification === 'unstake') updateNativeModAmount(stakeAmountResult)
  }, [currencyWallet, stakeDetails, modification])

  const updateNativeModAmount = (nativeAmount: string) => {
    if (!zeroString(nativeAmount)) {
      setNativeModAmount(nativeAmount)
    } else {
      // Reset scene if nativeAmount is zero
      if (nativeAmount !== DEFAULT) setNativeModAmount(DEFAULT) // restore placeholder text in amount tile
      setNativeFeeAmount(DEFAULT) // show zero fee
      setPendingChangeQuote(undefined) // reset the slider
    }
  }

  //
  // Handlers
  //

  const handleAmountEdited = (nativeAmount: string, exchangeAmount: string) => {
    updateNativeModAmount(nativeAmount)
  }

  const handleMaxButtonPress = () => {
    // Allocation to modify is in native currency
    if (currencyWallet.currencyInfo.currencyCode === allocationToMod?.tokenId) {
      // TODO: (V2) Set max amount minus fees if specifying native asset amount
    } else {
      if (modification === 'unstake') {
        updateNativeModAmount(allocationToMod?.nativeAmount ?? DEFAULT)
      } else if (modification === 'stake') {
        const amount = currencyWallet.balances[stakeAssetsName]
        updateNativeModAmount(amount !== '0' ? amount : DEFAULT)
      }
    }
  }

  const handleSlideComplete = reset => {
    if (pendingChangeQuote != null) {
      setSliderLocked(true)
      pendingChangeQuote
        .approve()
        .then(success => {
          Airship.show(bridge => <FlashNotification bridge={bridge} message={s.strings[`stake_change_${modification}_success`]} onPress={() => {}} />)
          navigation.pop()
        })
        .catch(err => {
          reset()
          showError(err.message)
        })
        .finally(() => {
          setSliderLocked(false)
        })
    }
  }

  const handleShowFlipInputModal = () => {
    const header = modification === 'stake' ? s.strings.stake_modal_modify_stake_title : s.strings.stake_modal_modify_unstake_title
    Airship.show(bridge => (
      <FlipInputModal
        bridge={bridge}
        walletId={walletId}
        currencyCode={stakeAssetsName}
        onAmountChanged={() => {}}
        onMaxSet={handleMaxButtonPress}
        headerText={sprintf(header, currencyWallet.name)}
      />
    ))
      .then(({ nativeAmount, exchangeAmount }) => {
        handleAmountEdited(nativeAmount, exchangeAmount)
      })
      .catch(error => console.log(error))
  }

  // Renderers
  const theme = useTheme()
  const styles = getStyles(theme)

  const renderEditableAmount = (allocationType: $PropertyType<QuoteAllocation, 'allocationType'>, stakeDetails: StakeDetails) => {
    if (stakeDetails !== null) {
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

      const title =
        allocationType === 'stake' ? (modification === 'stake' ? s.strings.stake_amount_stake : s.strings.stake_amount_unstake) : s.strings.stake_amount_claim

      return (
        <EditableAmountTile
          title={title}
          exchangeRates={guiExchangeRates}
          nativeAmount={nativeAmountMap[allocationType]}
          currencyWallet={currencyWallet}
          currencyCode={amountCurrencyCodeMap[allocationType]}
          exchangeDenomination={exchangeDenomMap[allocationType]}
          displayDenomination={displayDenomMap[allocationType]}
          lockInputs={allocationType === 'claim' || allocationType === 'unstake'}
          onPress={handleShowFlipInputModal}
        />
      )
    }
  }

  const renderWarning = () => {
    if (modification === 'unstake') return null

    return (
      <Alert
        marginRem={[0, 1, 1, 1]}
        title={s.strings.wc_smartcontract_warning_title}
        message={s.strings[`stake_warning_${modification}`]}
        numberOfLines={0}
        type="warning"
      />
    )
  }

  const displayAllocationTypesMap = {
    stake: ['stake'],
    claim: ['claim'],
    unstake: ['stake', 'claim']
  }
  const renderAmountTiles = (modAllocation, nativeAmount, modification) => {
    return (
      <View style={styles.amountTilesContainer}>
        <IconTile title={s.strings.wc_smartcontract_wallet} iconUri={getCurrencyIcon(currencyWallet.currencyInfo.pluginId).symbolImage}>
          <EdgeText>{currencyWallet.name}</EdgeText>
        </IconTile>
        {displayAllocationTypesMap[modification].map(allocationType => renderEditableAmount(allocationType, stakeDetails))}
        <CryptoFiatAmountTile
          title={s.strings.wc_smartcontract_network_fee}
          nativeCryptoAmount={nativeFeeAmount}
          cryptoCurrencyCode={currencyWallet.currencyInfo.currencyCode}
          isoFiatCurrencyCode={isoFiatCurrencyCode}
          denomination={nativeAssetDenomination}
        />
      </View>
    )
  }

  const sceneTitleMap = {
    stake: sprintf(s.strings.stake_x_to_earn_y, stakeAssetsName, rewardAssetsName),
    claim: s.strings.stake_claim_rewards,
    unstake: s.strings.stake_unstake_and_claim_rewards
  }

  if (stakeDetails.allocations.length === 0)
    return (
      <SceneWrapper background="theme">
        <FillLoader />
      </SceneWrapper>
    )

  const isSliderDisabled =
    sliderLocked || pendingChangeQuote == null || !pendingChangeQuote.allocations.some(quoteAllocation => bns.gt(quoteAllocation.nativeAmount, '0'))

  return (
    <SceneWrapper scroll background="theme">
      <SceneHeader style={styles.sceneHeader} title={sceneTitleMap[modification]} underline withTopMargin />
      {renderAmountTiles(allocationToMod, nativeModAmount, modification)}
      {renderWarning()}
      <Slider onSlidingComplete={handleSlideComplete} disabled={isSliderDisabled} showSpinner={sliderLocked} disabledText={s.strings.stake_disabled_slider} />
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
  amountTilesContainer: {
    marginBottom: theme.rem(1)
  }
}))
