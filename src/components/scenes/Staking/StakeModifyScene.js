// @flow
import { bns } from 'biggystring'
import * as React from 'react'
import { Image, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { sprintf } from 'sprintf-js'

import s from '../../../locales/strings.js'
import { Slider } from '../../../modules/UI/components/Slider/Slider.js'
import { type ChangeQuote, type ChangeQuoteRequest, type PositionAllocation, type QuoteAllocation } from '../../../plugins/stake-plugins'
import { getDenominationFromCurrencyInfo, getDisplayDenomination } from '../../../selectors/DenominationSelectors.js'
import { useEffect, useState } from '../../../types/reactHooks.js'
import { useSelector } from '../../../types/reactRedux'
import type { NavigationProp, RouteProp } from '../../../types/routerTypes'
import { getCurrencyIcon } from '../../../util/CurrencyInfoHelpers.js'
import { getWalletFiat } from '../../../util/CurrencyWalletHelpers.js'
import { getPolicyIconUris, getPolicyTitleName, getPositionAllocations, stakePlugin } from '../../../util/stakeUtils.js'
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

export const StakeModifyScene = (props: Props) => {
  // Constants
  const { navigation } = props
  const { walletId, stakePolicy, stakePosition, modification } = props.route.params
  const { stakePolicyId } = stakePolicy

  // Hooks
  const { currencyWallet, guiExchangeRates, isoFiatCurrencyCode, nativeAssetDenomination } = useSelector(state => {
    const { currencyWallets } = state.core.account
    const currencyWallet = currencyWallets[walletId]
    const guiExchangeRates = state.exchangeRates

    const nativeAssetDenomination = getDisplayDenomination(state, currencyWallet.currencyInfo.pluginId, currencyWallet.currencyInfo.currencyCode)
    const isoFiatCurrencyCode = getWalletFiat(currencyWallet).isoFiatCurrencyCode
    return {
      currencyWallet,
      guiExchangeRates,
      isoFiatCurrencyCode,
      nativeAssetDenomination
    }
  })

  // Current Allocation Info
  const [existingAllocations, setExistingAllocations] = useState<{ staked: PositionAllocation[], earned: PositionAllocation[] } | void>()

  // Handlers

  // ChangeQuote that gets rendered in the rows
  const [changeQuote, setChangeQuote] = useState<ChangeQuote | null>(null)
  const changeQuoteAllocations = changeQuote?.allocations ?? []

  // Request that the user will modify, triggering a ChangeQuote recalculation
  const [changeQuoteRequest, setChangeQuoteRequest] = useState<ChangeQuoteRequest>({
    action: modification,
    stakePolicyId: stakePolicy.stakePolicyId,
    tokenId: '',
    nativeAmount: '0',
    wallet: currencyWallet
  })

  // Slider state
  const [sliderLocked, setSliderLocked] = useState(false)

  // Effect that initializes the existing allocations, if any. Used for max amount in FlipInputModal
  useEffect(() => {
    const existingAllocations = getPositionAllocations(stakePosition)
    setExistingAllocations(existingAllocations)
  }, [currencyWallet, stakePosition])

  // An Effect for updating the ChangeQuote triggered by changes to changeQuoteRequest
  useEffect(() => {
    if (changeQuoteRequest.nativeAmount !== '0' || changeQuoteRequest.action === 'claim') {
      setChangeQuote(null)
      setSliderLocked(true)
      // Setup the request and get calculated values
      stakePlugin
        .fetchChangeQuote(changeQuoteRequest)
        .then((changeQuote: ChangeQuote) => {
          setChangeQuote(changeQuote)
        })
        .catch(err => {
          showError(err.message)
        })
        .finally(() => {
          setSliderLocked(false)
        })
    }
  }, [modification, stakePolicyId, changeQuoteRequest, currencyWallet, existingAllocations, stakePolicy])

  //
  // Handlers
  //

  const handleMaxButtonPress = (modCurrencyCode: string) => () => {
    // TODO: Move max amountlogic into stake plugin
    if (changeQuoteRequest != null) {
      if (modification === 'unstake') {
        const existingStaked = existingAllocations?.staked ?? []
        const allocationToMod = existingStaked.find(positionAllocation => positionAllocation.tokenId === modCurrencyCode)
        const modChangeQuoteRequest = { ...changeQuoteRequest, tokenId: modCurrencyCode, nativeAmount: allocationToMod?.nativeAmount }
        setChangeQuoteRequest(modChangeQuoteRequest)
      } else if (modification === 'stake') {
        // Save all max amounts to find the limiting amount

        // Set an arbitrary amount in the changeQuoteRequest to ensure a fee is
        // generated
        stakePlugin.fetchChangeQuote({ ...changeQuoteRequest, nativeAmount: '1' }).then((tempQuote: ChangeQuote) => {
          // Save the max stake amount for each currency according to available
          // wallet balances
          const maxAmountsMap: Array<{ currencyCode: string, maxAmount: string }> = tempQuote.allocations.map(tempQuoteAllocation => {
            const quoteCurrencyCode = tempQuoteAllocation.tokenId
            const balanceAmount = currencyWallet.balances[modCurrencyCode]
            let maxAmount = '0'

            // Native currency
            if (currencyWallet.currencyInfo.currencyCode === modCurrencyCode) {
              // Subtract network fees from the ChangeQuote from the max amount of native currency
              const feeAllocation = tempQuote.allocations.find(allocation => allocation.allocationType === 'fee')
              maxAmount = bns.sub(balanceAmount, feeAllocation?.nativeAmount || '0')
            }
            // Token currency
            else {
              maxAmount = balanceAmount
            }
            return { currencyCode: quoteCurrencyCode, maxAmount }
          })

          // Get the change quote for the actual user modification amount
          const walletBalance = maxAmountsMap.find(({ currencyCode, maxAmount }) => currencyCode === modCurrencyCode)?.maxAmount

          stakePlugin.fetchChangeQuote({ ...changeQuoteRequest, nativeAmount: walletBalance }).then(tempModChangeQuote => {
            // Check if the max amount for this currency requires a higher max amount of
            // another currency than is available
            const filteredMaxAmountsMap = maxAmountsMap.filter(({ currencyCode, maxAmount }) => currencyCode !== modCurrencyCode)

            const limitingMaxAmountPair = filteredMaxAmountsMap.find(({ currencyCode, maxAmount }) => {
              const comparisonMaxAmount =
                tempModChangeQuote.allocations.find(tempModAllocation => tempModAllocation.tokenId === currencyCode)?.nativeAmount || '0'
              return bns.lt(maxAmount, comparisonMaxAmount)
            })

            if (limitingMaxAmountPair != null) {
              // Return the max amount held in the wallet for the limiting currency
              setChangeQuoteRequest({ ...changeQuoteRequest, tokenId: limitingMaxAmountPair.currencyCode, nativeAmount: limitingMaxAmountPair.maxAmount })
            } else {
              // Return the max amount held in the wallet for the requested currency
              setChangeQuoteRequest({ ...changeQuoteRequest, nativeAmount: walletBalance })
            }
          })
        })
      }
    }
  }

  const handleSlideComplete = reset => {
    if (changeQuote != null) {
      setSliderLocked(true)
      changeQuote
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

  const handleShowFlipInputModal = (currencyCode: string) => () => {
    const header = modification === 'stake' ? s.strings.stake_modal_modify_stake_title : s.strings.stake_modal_modify_unstake_title
    Airship.show(bridge => (
      <FlipInputModal
        bridge={bridge}
        walletId={walletId}
        currencyCode={currencyCode}
        onAmountChanged={() => {}}
        onMaxSet={handleMaxButtonPress(currencyCode)}
        headerText={sprintf(header, currencyWallet.name)}
      />
    ))
      .then(({ nativeAmount, exchangeAmount }) => {
        // set the modified amount
        if (nativeAmount !== '0') setChangeQuoteRequest({ ...changeQuoteRequest, tokenId: currencyCode, nativeAmount: nativeAmount })
      })
      .catch(error => console.log(error))
  }

  // Renderers
  const theme = useTheme()
  const styles = getStyles(theme)

  const renderEditableQuoteAmountRow = (allocationType: 'stake' | 'unstake' | 'claim', asset: { pluginId: string, tokenId: string }) => {
    const quoteAllocation: QuoteAllocation | void =
      changeQuote != null
        ? changeQuote.allocations.find(
            allocation => allocationType === allocation.allocationType && allocation.pluginId === asset.pluginId && allocation.tokenId === asset.tokenId
          )
        : undefined

    const quoteCurrencyCode = asset.tokenId
    const quoteDenom = getDenominationFromCurrencyInfo(currencyWallet.currencyInfo, quoteCurrencyCode)

    const title =
      allocationType === 'stake'
        ? sprintf(s.strings.stake_amount_s_stake, quoteCurrencyCode)
        : allocationType === 'unstake'
        ? sprintf(s.strings.stake_amount_s_unstake, quoteCurrencyCode)
        : sprintf(s.strings.stake_amount_claim, quoteCurrencyCode)

    const nativeAmount = zeroString(quoteAllocation?.nativeAmount) ? '' : quoteAllocation?.nativeAmount ?? ''

    return (
      <EditableAmountTile
        title={title}
        exchangeRates={guiExchangeRates}
        nativeAmount={nativeAmount}
        currencyWallet={currencyWallet}
        currencyCode={quoteCurrencyCode}
        exchangeDenomination={quoteDenom}
        displayDenomination={quoteDenom}
        lockInputs={allocationType === 'claim'}
        onPress={handleShowFlipInputModal(quoteCurrencyCode)}
      />
    )
  }

  const renderWarning = () => {
    // Warnings are only shown for single asset staking
    let warningMessage = null
    if (existingAllocations?.staked.length === 1 && changeQuote !== null) {
      const modStakedAmount =
        changeQuoteAllocations.find(allocation => allocation.allocationType === 'stake' && bns.gt(allocation.nativeAmount, '0'))?.nativeAmount || '0'
      const stakedAmount = existingAllocations?.staked[0].nativeAmount ?? '0'

      const isRemainingStakedAmount = bns.gt(stakedAmount, modStakedAmount)
      const existingEarnedAllocations = existingAllocations?.earned ?? []
      const isUnclaimedRewards = existingEarnedAllocations.some(earnedAllocation => bns.gt(earnedAllocation.nativeAmount, '0'))

      if (modification === 'stake') warningMessage = isRemainingStakedAmount || isUnclaimedRewards ? s.strings.stake_warning_stake : null
      if (modification === 'claim') warningMessage = s.strings.stake_warning_claim
      if (modification === 'unstake') warningMessage = isRemainingStakedAmount ? s.strings.stake_warning_unstake : null
    }
    return warningMessage == null ? null : (
      <Alert marginRem={[0, 1, 1, 1]} title={s.strings.wc_smartcontract_warning_title} message={warningMessage} numberOfLines={0} type="warning" />
    )
  }

  const renderChangeQuoteAmountTiles = modification => {
    return (
      <View style={styles.amountTilesContainer}>
        <IconTile title={s.strings.wc_smartcontract_wallet} iconUri={getCurrencyIcon(currencyWallet.currencyInfo.pluginId).symbolImage}>
          <EdgeText>{currencyWallet.name}</EdgeText>
        </IconTile>
        {
          // Render stake/unstake amount tiles
          modification === 'stake' || modification === 'unstake'
            ? stakePolicy.stakeAssets.map(asset => renderEditableQuoteAmountRow(modification, asset))
            : null
        }
        {
          // Render claim amount tile
          modification === 'claim' || modification === 'unstake' ? stakePolicy.rewardAssets.map(asset => renderEditableQuoteAmountRow('claim', asset)) : null
        }
        {
          // Render network fee tile
          <CryptoFiatAmountTile
            title={s.strings.wc_smartcontract_network_fee}
            nativeCryptoAmount={changeQuoteAllocations.find(allocation => allocation.allocationType === 'fee')?.nativeAmount ?? '0'}
            cryptoCurrencyCode={currencyWallet.currencyInfo.currencyCode}
            isoFiatCurrencyCode={isoFiatCurrencyCode}
            denomination={nativeAssetDenomination}
          />
        }
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

  const isSliderDisabled = sliderLocked || changeQuote == null || !changeQuote.allocations.some(quoteAllocation => bns.gt(quoteAllocation.nativeAmount, '0'))

  const sceneTitleMap = {
    stake: getPolicyTitleName(stakePolicy),
    claim: s.strings.stake_claim_rewards,
    unstake: s.strings.stake_claim_unstake
  }

  const policyIcons = getPolicyIconUris(currencyWallet, stakePolicy)
  const icon = modification === 'stake' ? null : <Image style={styles.icon} source={{ uri: policyIcons.rewardAssetUris[0] }} />

  return (
    <SceneWrapper scroll background="theme">
      <ScrollView>
        <SceneHeader style={styles.sceneHeader} title={sceneTitleMap[modification]} underline withTopMargin>
          {icon}
        </SceneHeader>
        {renderChangeQuoteAmountTiles(modification)}
        {renderWarning()}
        <Slider onSlidingComplete={handleSlideComplete} disabled={isSliderDisabled} showSpinner={sliderLocked} disabledText={s.strings.stake_disabled_slider} />
      </ScrollView>
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
    marginLeft: theme.rem(0.5),
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
