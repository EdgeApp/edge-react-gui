// @flow
import { bns } from 'biggystring'
import * as React from 'react'
import { Image, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { sprintf } from 'sprintf-js'

import s from '../../../locales/strings.js'
import { Slider } from '../../../modules/UI/components/Slider/Slider.js'
import { type ChangeQuote, type ChangeQuoteRequest, type PositionAllocation, type QuoteAllocation } from '../../../plugins/stake-plugins'
import { getSeed } from '../../../plugins/stake-plugins/util/getSeed'
import { getDenominationFromCurrencyInfo, getDisplayDenomination } from '../../../selectors/DenominationSelectors.js'
import { useEffect, useMemo, useState } from '../../../types/reactHooks.js'
import { useSelector } from '../../../types/reactRedux'
import type { NavigationProp, RouteProp } from '../../../types/routerTypes'
import { getCurrencyIconUris } from '../../../util/CdnUris'
import { getPolicyIconUris, getPolicyTitleName, getPositionAllocations, stakePlugin } from '../../../util/stakeUtils.js'
import { zeroString } from '../../../util/utils.js'
import { FillLoader } from '../../common/FillLoader.js'
import { SceneWrapper } from '../../common/SceneWrapper.js'
import { FlipInputModal } from '../../modals/FlipInputModal.js'
import { FlashNotification } from '../../navigation/FlashNotification.js'
import { Airship } from '../../services/AirshipInstance.js'
import { cacheStyles, useTheme } from '../../services/ThemeContext.js'
import { Alert } from '../../themed/Alert.js'
import { EdgeText } from '../../themed/EdgeText.js'
import { SceneHeader } from '../../themed/SceneHeader.js'
import { CryptoFiatAmountTile } from '../../tiles/CryptoFiatAmountTile.js'
import { EditableAmountTile } from '../../tiles/EditableAmountTile.js'
import { ErrorTile } from '../../tiles/ErrorTile.js'
import { IconTile } from '../../tiles/IconTile'

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
  const { wallet, guiExchangeRates, nativeAssetDenomination } = useSelector(state => {
    const { currencyWallets } = state.core.account
    const wallet = currencyWallets[walletId]
    const guiExchangeRates = state.exchangeRates

    const nativeAssetDenomination = getDisplayDenomination(state, wallet.currencyInfo.pluginId, wallet.currencyInfo.currencyCode)
    return {
      wallet,
      guiExchangeRates,
      nativeAssetDenomination
    }
  })

  // Current Allocation Info
  const [existingAllocations, setExistingAllocations] = useState<{ staked: PositionAllocation[], earned: PositionAllocation[] } | void>()

  // ChangeQuote that gets rendered in the rows
  const [changeQuote, setChangeQuote] = useState<ChangeQuote | null>(null)
  const changeQuoteAllocations = changeQuote?.allocations ?? []

  // Request that the user will modify, triggering a ChangeQuote recalculation
  const [changeQuoteRequest, setChangeQuoteRequest] = useState<ChangeQuoteRequest>({
    action: modification,
    stakePolicyId: stakePolicy.stakePolicyId,
    currencyCode: '',
    nativeAmount: '0',
    signerSeed: getSeed(wallet)
  })

  // Slider state
  const [sliderLocked, setSliderLocked] = useState(false)

  // Error message tile contents
  const [errorMessage, setErrorMessage] = useState('')

  // Effect that initializes the existing allocations, if any. Used for max amount in FlipInputModal
  useEffect(() => {
    const existingAllocations = getPositionAllocations(stakePosition)
    setExistingAllocations(existingAllocations)

    // Initialize the claim row since the user would never modify the amount
    if (modification === 'claim' && changeQuoteRequest.nativeAmount === '0')
      setChangeQuoteRequest({
        ...changeQuoteRequest,
        currencyCode: stakePolicy.rewardAssets[0].currencyCode,
        nativeAmount: existingAllocations.earned[0].nativeAmount
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // An Effect for updating the ChangeQuote triggered by changes to changeQuoteRequest
  useEffect(() => {
    let abort = false
    if (changeQuoteRequest.nativeAmount !== '0') {
      setChangeQuote(null)
      setSliderLocked(true)
      // Setup the request and get calculated values
      stakePlugin
        .fetchChangeQuote(changeQuoteRequest)
        .then((changeQuote: ChangeQuote) => {
          if (abort) return
          // Success, clear error msg and set change quote to trigger re-render
          setErrorMessage('')
          setChangeQuote(changeQuote)
        })
        .catch(err => {
          if (abort) return
          // Display error msg tile
          setErrorMessage(err.message)
        })
        .finally(() => {
          if (abort) return
          setSliderLocked(false)
        })
    }
    return () => {
      abort = true
    }
  }, [modification, stakePolicyId, changeQuoteRequest, wallet, existingAllocations, stakePolicy])

  //
  // Handlers
  //

  const existingStaked = existingAllocations?.staked ?? []
  const handleMaxButtonPress = (modCurrencyCode: string) => () => {
    // TODO: Move max amountlogic into stake plugin
    if (changeQuoteRequest != null) {
      if (modification === 'unstake') {
        const allocationToMod = existingStaked.find(positionAllocation => positionAllocation.currencyCode === modCurrencyCode)
        const modChangeQuoteRequest = { ...changeQuoteRequest, currencyCode: modCurrencyCode, nativeAmount: allocationToMod?.nativeAmount }
        setChangeQuoteRequest(modChangeQuoteRequest)
      } else if (modification === 'stake' && existingStaked.length === 1) {
        setChangeQuoteRequest({ ...changeQuoteRequest, currencyCode: modCurrencyCode, nativeAmount: wallet.balances[modCurrencyCode] })
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
          setErrorMessage(err.message)
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
        headerText={sprintf(header, wallet.name)}
        hideMaxButton={
          /* TODO: Max button needs to be enabled after max calculation for
          multi-asset staking is fully implemented and working in plugin */
          existingStaked.length > 1
        }
      />
    ))
      .then(({ nativeAmount, exchangeAmount }) => {
        // set the modified amount
        if (nativeAmount !== '0') setChangeQuoteRequest({ ...changeQuoteRequest, currencyCode: currencyCode, nativeAmount: nativeAmount })
      })
      .catch(error => console.log(error))
  }

  // Renderers
  const theme = useTheme()
  const styles = getStyles(theme)

  const renderEditableQuoteAmountRow = (allocationType: 'stake' | 'unstake' | 'claim', asset: { pluginId: string, currencyCode: string }) => {
    const { pluginId, currencyCode } = asset
    const quoteAllocation: QuoteAllocation | void =
      changeQuote != null
        ? changeQuote.allocations.find(
            allocation => allocationType === allocation.allocationType && allocation.pluginId === pluginId && allocation.currencyCode === currencyCode
          )
        : undefined

    const quoteCurrencyCode = currencyCode
    const quoteDenom = getDenominationFromCurrencyInfo(wallet.currencyInfo, quoteCurrencyCode)

    const title =
      allocationType === 'stake'
        ? sprintf(s.strings.stake_amount_s_stake, quoteCurrencyCode)
        : allocationType === 'unstake'
        ? sprintf(s.strings.stake_amount_s_unstake, quoteCurrencyCode)
        : sprintf(s.strings.stake_amount_claim, quoteCurrencyCode)

    const nativeAmount = zeroString(quoteAllocation?.nativeAmount) ? '' : quoteAllocation?.nativeAmount ?? ''
    const earnedAmount = existingAllocations?.earned[0].nativeAmount ?? '0'

    const isClaim = allocationType === 'claim'
    return (
      <EditableAmountTile
        title={title}
        key={allocationType + pluginId + currencyCode}
        exchangeRates={guiExchangeRates}
        nativeAmount={isClaim ? earnedAmount : nativeAmount}
        wallet={wallet}
        currencyCode={quoteCurrencyCode}
        exchangeDenomination={quoteDenom}
        displayDenomination={quoteDenom}
        lockInputs={isClaim}
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

      if (modification === 'stake') warningMessage = s.strings.stake_warning_stake
      if (modification === 'claim') warningMessage = s.strings.stake_warning_claim
      if (modification === 'unstake') warningMessage = isRemainingStakedAmount ? s.strings.stake_warning_unstake : null
    }
    return warningMessage == null ? null : (
      <Alert marginRem={[0, 1, 1, 1]} title={s.strings.wc_smartcontract_warning_title} message={warningMessage} numberOfLines={0} type="warning" />
    )
  }

  const renderChangeQuoteAmountTiles = modification => {
    const networkFeeQuote = changeQuoteAllocations.find(allocation => allocation.allocationType === 'fee')
    return (
      <View style={styles.amountTilesContainer}>
        <IconTile title={s.strings.wc_smartcontract_wallet} iconUri={getCurrencyIconUris(wallet.currencyInfo.pluginId).symbolImage}>
          <EdgeText>{wallet.name}</EdgeText>
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
            nativeCryptoAmount={networkFeeQuote?.nativeAmount ?? '0'}
            walletId={walletId}
            currencyCode={networkFeeQuote?.currencyCode}
            denomination={nativeAssetDenomination}
          />
        }
        {errorMessage === '' || sliderLocked === true ? null : <ErrorTile message={errorMessage} />}
      </View>
    )
  }

  const sceneTitleMap = useMemo(
    () => ({
      stake: getPolicyTitleName(stakePolicy),
      claim: s.strings.stake_claim_rewards,
      unstake: s.strings.stake_unstake_claim
    }),
    [stakePolicy]
  )

  const policyIcons = getPolicyIconUris(wallet.currencyInfo, stakePolicy)
  const icon = useMemo(
    () => (modification === 'stake' ? null : <Image style={styles.icon} source={{ uri: policyIcons.rewardAssetUris[0] }} />),
    [modification, policyIcons.rewardAssetUris, styles.icon]
  )

  const sceneHeader = useMemo(
    () => (
      <SceneHeader style={styles.sceneHeader} title={sceneTitleMap[modification]} underline withTopMargin>
        {icon}
      </SceneHeader>
    ),
    [icon, modification, sceneTitleMap, styles.sceneHeader]
  )

  if (stakePosition.allocations.length === 0) {
    return (
      <SceneWrapper background="theme">
        <FillLoader />
      </SceneWrapper>
    )
  }

  const isSliderDisabled = sliderLocked || changeQuote == null || !changeQuote.allocations.some(quoteAllocation => bns.gt(quoteAllocation.nativeAmount, '0'))

  return (
    <SceneWrapper scroll background="theme">
      <ScrollView>
        {sceneHeader}
        {renderChangeQuoteAmountTiles(modification)}
        {renderWarning()}
        <View style={styles.footer}>
          <Slider
            onSlidingComplete={handleSlideComplete}
            disabled={isSliderDisabled}
            showSpinner={sliderLocked}
            disabledText={s.strings.stake_disabled_slider}
          />
        </View>
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
  },
  footer: {
    marginBottom: theme.rem(2)
  }
}))
