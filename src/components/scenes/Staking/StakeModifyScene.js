// @flow
import { bns } from 'biggystring'
import * as React from 'react'
import { View } from 'react-native'
import { sprintf } from 'sprintf-js'

import s from '../../../locales/strings.js'
import { Slider } from '../../../modules/UI/components/Slider/Slider.js'
import { type ChangeQuote, type ChangeQuoteRequest, type PositionAllocation, type QuoteAllocation } from '../../../plugins/stake-plugins'
import { getDisplayDenomination, getExchangeDenomination } from '../../../selectors/DenominationSelectors.js'
import { useEffect, useState } from '../../../types/reactHooks.js'
import { useSelector } from '../../../types/reactRedux'
import type { NavigationProp, RouteProp } from '../../../types/routerTypes'
import { getCurrencyIcon } from '../../../util/CurrencyInfoHelpers.js'
import { getWalletFiat } from '../../../util/CurrencyWalletHelpers.js'
import { getPolicyAssetName, getPositionAllocations, stakePlugin } from '../../../util/stakeUtils.js'
import { FillLoader } from '../../common/FillLoader.js'
import { SceneWrapper } from '../../common/SceneWrapper.js'
import { FlipInputModal } from '../../modals/FlipInputModal.js'
import { Airship, showError, showToast } from '../../services/AirshipInstance.js'
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

// type QuoteAllocationType = $PropertyType<QuoteAllocation, 'allocationType'>

export const StakeModifyScene = (props: Props) => {
  // Constants
  const { navigation } = props
  const { walletId, stakePolicy, stakePosition, modification } = props.route.params
  const { stakePolicyId } = stakePolicy
  // TODO: Remove hard-coding for single asset to support multiple stake/reward assets
  const stakeAssetsName = getPolicyAssetName(stakePolicy, 'stakeAssets')
  const rewardAssetsName = getPolicyAssetName(stakePolicy, 'rewardAssets')

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
  const [existingAllocations, setExistingAllocations] = useState<{ staked: PositionAllocation[], earned: PositionAllocation[] } | void>()

  // Handlers

  // ChangeQuote that gets rendered in the rows
  const [pendingChangeQuote, setPendingChangeQuote] = useState<ChangeQuote | void>()

  // Request that the user will modify, triggering a ChangeQuote recalculation
  const [changeQuoteRequest, setChangeQuoteRequest] = useState<ChangeQuoteRequest>({
    action: modification,
    stakePolicyId: stakePolicy.stakePolicyId,
    tokenId: '',
    nativeAmount: '0',
    wallet: currencyWallet
  })

  const [nativeFeeAmount, setNativeFeeAmount] = useState('0')

  // Effect that initializes the existing allocations, if any. Used for max amount in FlipInputModal
  useEffect(() => {
    const existingAllocations = getPositionAllocations(stakePosition)
    setExistingAllocations(existingAllocations)
  }, [currencyWallet, stakePosition])

  // An Effect for updating the ChangeQuote triggered by changes to changeQuoteRequest
  useEffect(() => {
    if (changeQuoteRequest == null || changeQuoteRequest.tokenId === '' || changeQuoteRequest.nativeAmount === '0') {
      // Setup a default ChangeQuote for rendering based on policy if no position changes have been requested or scene just mounted

      const stakeChangeQuotes = stakePolicy.stakeAssets.map(({ pluginId, tokenId }) => {
        return {
          allocationType: 'stake',
          tokenId: tokenId,
          nativeAmount: '0'
        }
      })
      const rewardChangeQuotes = stakePolicy.rewardAssets.map(({ pluginId, tokenId }) => {
        return {
          allocationType: 'claim',
          tokenId: tokenId,
          nativeAmount: existingAllocations?.earned[0].nativeAmount || '0'
        }
      })
      setPendingChangeQuote({
        allocations: [...stakeChangeQuotes, ...rewardChangeQuotes],
        approve: async () => {}
      })
    } else {
      // Setup the request
      stakePlugin
        .fetchChangeQuote(
          {
            action: modification,
            stakePolicyId: changeQuoteRequest.stakePolicyId,
            tokenId: changeQuoteRequest.tokenId,
            nativeAmount: changeQuoteRequest.nativeAmount,
            wallet: currencyWallet
          }
          // changeQuoteRequest // TODO: Manage only values being changed instead of the whole object?
        )
        .then((changeQuote: ChangeQuote) => {
          setPendingChangeQuote(changeQuote)
          setNativeFeeAmount(changeQuote.allocations.find(allocation => allocation.allocationType === 'fee')?.nativeAmount ?? '0')
        })
        .catch(err => {
          showError(err.message)
        })
    }
  }, [modification, stakePolicyId, changeQuoteRequest, currencyWallet, existingAllocations, stakePolicy.stakeAssets])

  //
  // Handlers
  //

  // HACK: FlipInputModal is soon getting updates to not be trash.
  // In the meantime, split out the modification calls to the different assets into separate methods.
  const handleAmountEdited = (nativeAmount: string, exchangeAmount: string) => {
    // TODO: NOT NEEDED? Set which allocation to modify
    console.log('handleAmountEdited: ' + nativeAmount)
  }

  const handleMaxButtonPress = (modCurrencyCode: string) => () => {
    // TODO: Set which allocation to modify

    if (changeQuoteRequest != null) {
      if (modification === 'unstake') {
        console.log('max unstaking ' + modCurrencyCode)
        const allocationToMod = existingAllocations?.staked.find(positionAllocation => positionAllocation.tokenId === modCurrencyCode)
        setChangeQuoteRequest({ ...changeQuoteRequest, nativeAmount: allocationToMod?.nativeAmount })
      } else if (modification === 'stake') {
        if (currencyWallet.currencyInfo.currencyCode === changeQuoteRequest?.tokenId) {
          // TODO: (V2) Set max amount minus fees if specifying native asset amount
          console.log('max staking NATIVE')
        } else {
          console.log('max staking TOKEN ' + modCurrencyCode + currencyWallet.balances[modCurrencyCode])
          setChangeQuoteRequest({ ...changeQuoteRequest, nativeAmount: currencyWallet.balances[modCurrencyCode] })
        }
      }
    }
  }

  const handleSlideComplete = reset => {
    if (pendingChangeQuote != null) {
      pendingChangeQuote
        .approve()
        .then(success => {
          if (modification === 'stake') showToast(s.strings.stake_change_stake_success)
          if (modification === 'unstake') showToast(s.strings.stake_change_unstake_success)
          if (modification === 'claim') showToast(s.strings.stake_change_claim_success)
          navigation.pop()
        })
        .catch(err => {
          // TODO: Make the slider reset
          reset()
          showError(err.message)
        })
    }
  }

  const handleShowFlipInputModal = (currencyCode: string) => () => {
    const header = modification === 'stake' ? s.strings.stake_modal_modify_stake_title : s.strings.stake_modal_modify_unstake_title
    Airship.show(bridge => (
      <FlipInputModal
        bridge={bridge}
        walletId={walletId}
        currencyCode={currencyCode}
        onAmountChanged={handleAmountEdited}
        onMaxSet={handleMaxButtonPress(currencyCode)}
        headerText={sprintf(header, currencyWallet.name)}
      />
    ))
      .then(({ nativeAmount, exchangeAmount }) => {
        // set the appropriate amount
        setChangeQuoteRequest({ ...changeQuoteRequest, tokenId: currencyCode, nativeAmount: nativeAmount })
      })
      .catch(error => console.log(error))
  }

  // Renderers
  const theme = useTheme()
  const styles = getStyles(theme)

  const renderEditableQuoteAmountRow = (quoteAllocation: QuoteAllocation) => {
    console.log('\x1b[34m\x1b[43m' + `quoteAllocation.allocationType: ${JSON.stringify(quoteAllocation.allocationType, null, 2)}` + '\x1b[0m')
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

    const quoteAllocationType = quoteAllocation.allocationType
    const title =
      quoteAllocationType === 'stake'
        ? modification === 'stake'
          ? sprintf(s.strings.stake_amount_stake, quoteAllocation.tokenId)
          : sprintf(s.strings.stake_amount_unstake, quoteAllocation.tokenId)
        : sprintf(s.strings.stake_amount_claim, quoteAllocation.tokenId)

    return (
      <EditableAmountTile
        title={title}
        exchangeRates={guiExchangeRates}
        nativeAmount={quoteAllocation.nativeAmount}
        currencyWallet={currencyWallet}
        currencyCode={quoteAllocation.tokenId}
        exchangeDenomination={exchangeDenomMap[quoteAllocationType]}
        displayDenomination={displayDenomMap[quoteAllocationType]}
        lockInputs={quoteAllocationType === 'claim'}
        onPress={handleShowFlipInputModal(quoteAllocation.tokenId)}
      />
    )
  }

  const renderWarning = () => {
    if (modification !== 'claim') return null
    return (
      <Alert
        marginRem={[0, 1, 1, 1]}
        title={s.strings.wc_smartcontract_warning_title}
        message={s.strings.stake_warning_claim}
        numberOfLines={0}
        type="warning"
      />
    )
  }

  // Mapping for filtering the array of QuoteAllocations in the pending ChangeQuote based on the
  // modification action of the scene.
  // We only display certain allocationTypes from the ChangeQuote allocations:QuoteAllocation[]
  // depending on the modification being done in the scene.
  const displayChangeQuoteMap = {
    stake: ['stake'],
    claim: ['claim'],
    unstake: ['stake', 'claim']
  }

  const renderChangeQuoteAmountTiles = modification => {
    return (
      <View style={styles.amountTilesContainer}>
        <IconTile title={s.strings.wc_smartcontract_wallet} iconUri={getCurrencyIcon(currencyWallet.currencyInfo.pluginId).symbolImage}>
          <EdgeText>{currencyWallet.name}</EdgeText>
        </IconTile>
        {displayChangeQuoteMap[modification].map(displayAllocationType => {
          if (pendingChangeQuote == null) return null

          const quoteAllocationsToDisplay = pendingChangeQuote?.allocations.filter(quoteAllocation => quoteAllocation.allocationType === displayAllocationType)
          return quoteAllocationsToDisplay?.map(quoteAllocation => renderEditableQuoteAmountRow(quoteAllocation))
        })}
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

  if (stakePosition.allocations.length === 0) {
    return (
      <SceneWrapper background="theme">
        <FillLoader />
      </SceneWrapper>
    )
  }

  const isSliderDisabled = pendingChangeQuote == null || !pendingChangeQuote.allocations.some(quoteAllocation => bns.gt(quoteAllocation.nativeAmount, '0'))

  const sceneTitleMap = {
    stake: sprintf(s.strings.stake_x_to_earn_y, stakeAssetsName, rewardAssetsName),
    claim: s.strings.stake_claim_rewards,
    unstake: s.strings.stake_claim_unstake
  }

  return (
    <SceneWrapper background="theme">
      <SceneHeader style={styles.sceneHeader} title={sceneTitleMap[modification]} underline withTopMargin />
      {renderChangeQuoteAmountTiles(modification)}
      {renderWarning()}
      <Slider onSlidingComplete={handleSlideComplete} disabled={isSliderDisabled} showSpinner={null} disabledText={s.strings.stake_disabled_slider} />
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
