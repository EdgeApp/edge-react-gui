import { gt, toFixed } from 'biggystring'
import * as React from 'react'
import { Image, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { sprintf } from 'sprintf-js'

import s from '../../../locales/strings'
import { Slider } from '../../../modules/UI/components/Slider/Slider'
import { ChangeQuote, ChangeQuoteRequest, PositionAllocation, QuoteAllocation, StakeBelowLimitError } from '../../../plugins/stake-plugins/types'
import { getDenominationFromCurrencyInfo, getDisplayDenomination } from '../../../selectors/DenominationSelectors'
import { useSelector } from '../../../types/reactRedux'
import { NavigationProp, RouteProp } from '../../../types/routerTypes'
import { getCurrencyIconUris } from '../../../util/CdnUris'
import { getWalletName } from '../../../util/CurrencyWalletHelpers'
import { getPolicyIconUris, getPolicyTitleName, getPositionAllocations } from '../../../util/stakeUtils'
import { toBigNumberString } from '../../../util/toBigNumberString'
import { zeroString } from '../../../util/utils'
import { SceneWrapper } from '../../common/SceneWrapper'
import { ButtonsModal } from '../../modals/ButtonsModal'
import { FlipInputModal, FlipInputModalResult } from '../../modals/FlipInputModal'
import { FlashNotification } from '../../navigation/FlashNotification'
import { FillLoader } from '../../progress-indicators/FillLoader'
import { Airship } from '../../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../../services/ThemeContext'
import { Alert } from '../../themed/Alert'
import { EdgeText } from '../../themed/EdgeText'
import { SceneHeader } from '../../themed/SceneHeader'
import { CryptoFiatAmountTile } from '../../tiles/CryptoFiatAmountTile'
import { EditableAmountTile } from '../../tiles/EditableAmountTile'
import { ErrorTile } from '../../tiles/ErrorTile'
import { IconTile } from '../../tiles/IconTile'
import { Tile } from '../../tiles/Tile'

interface Props {
  navigation: NavigationProp<'stakeModify'>
  route: RouteProp<'stakeModify'>
}

export const StakeModifyScene = (props: Props) => {
  // Constants
  const { navigation } = props
  const { stakePlugin, walletId, stakePolicy, stakePosition, modification } = props.route.params
  const { stakePolicyId, stakeWarning, unstakeWarning, claimWarning, disableMaxStake } = stakePolicy

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
  const [existingAllocations, setExistingAllocations] = React.useState<{ staked: PositionAllocation[]; earned: PositionAllocation[] } | undefined>()

  // ChangeQuote that gets rendered in the rows
  const [changeQuote, setChangeQuote] = React.useState<ChangeQuote | null>(null)
  const changeQuoteAllocations = changeQuote?.allocations ?? []
  const { quoteInfo } = changeQuote ?? {}

  // Request that the user will modify, triggering a ChangeQuote recalculation
  const [changeQuoteRequest, setChangeQuoteRequest] = React.useState<ChangeQuoteRequest>({
    action: modification,
    stakePolicyId: stakePolicy.stakePolicyId,
    currencyCode: '',
    nativeAmount: '0',
    wallet
  })

  // Slider state
  const [sliderLocked, setSliderLocked] = React.useState(false)

  // Error message tile contents
  const [errorMessage, setErrorMessage] = React.useState('')

  // Effect that initializes the existing allocations, if any. Used for max amount in FlipInputModal
  React.useEffect(() => {
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
  React.useEffect(() => {
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
          if (err instanceof StakeBelowLimitError) {
            const { currencyCode, nativeMin } = err
            let errMessage = changeQuoteRequest.action === 'stake' ? s.strings.stake_error_stake_below_minimum : s.strings.stake_error_unstake_below_minimum
            if (nativeMin != null) {
              wallet.nativeToDenomination(nativeMin, currencyCode).then(minExchangeAmount => {
                errMessage += `: ${minExchangeAmount} ${currencyCode}`
                setErrorMessage(errMessage)
              })
            } else {
              setErrorMessage(errMessage)
            }
          } else {
            setErrorMessage(err.message)
          }
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
        // @ts-expect-error
        setChangeQuoteRequest(modChangeQuoteRequest)
      } else if (modification === 'stake' && existingStaked.length === 1) {
        setChangeQuoteRequest({ ...changeQuoteRequest, currencyCode: modCurrencyCode, nativeAmount: wallet.balances[modCurrencyCode] })
      }
    }
  }

  // @ts-expect-error
  const handleSlideComplete = reset => {
    const message = {
      stake: s.strings.stake_change_stake_success,
      unstake: s.strings.stake_change_unstake_success,
      claim: s.strings.stake_change_claim_success,
      unstakeExact: ''
    }

    if (changeQuote != null) {
      setSliderLocked(true)
      changeQuote
        .approve()
        .then(success => {
          Airship.show(bridge => <FlashNotification bridge={bridge} message={message[modification]} onPress={() => {}} />)
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

    // TODO: Max button needs to be enabled after max calculation for
    // multi-asset staking is fully implemented and working in plugin
    // Also disable if the policy explicity disables it.
    const hideMaxButton = existingStaked.length > 1 || (disableMaxStake ?? false)

    Airship.show<FlipInputModalResult>(bridge => (
      <FlipInputModal
        bridge={bridge}
        navigation={navigation}
        walletId={walletId}
        currencyCode={currencyCode}
        onAmountChanged={() => {}}
        onMaxSet={handleMaxButtonPress(currencyCode)}
        headerText={sprintf(header, getWalletName(wallet))}
        hideMaxButton={hideMaxButton}
      />
    ))
      .then(({ nativeAmount, exchangeAmount }) => {
        // set the modified amount
        if (nativeAmount !== '0') setChangeQuoteRequest({ ...changeQuoteRequest, currencyCode: currencyCode, nativeAmount: nativeAmount })
      })
      .catch(error => console.log(error))
  }

  const handlePressStakingFee = (modification: ChangeQuoteRequest['action']) => () => {
    let title: string
    let message: string
    if (modification === 'stake') {
      title = s.strings.stake_estimated_staking_fee
      message = s.strings.stake_staking_fee_message
    } else {
      title = s.strings.stake_estimated_unstaking_fee
      message = s.strings.stake_unstaking_fee_message
    }

    Airship.show<'ok' | undefined>(bridge => (
      <ButtonsModal
        bridge={bridge}
        title={title}
        message={message}
        buttons={{
          ok: { label: s.strings.string_ok }
        }}
      />
    ))
  }

  const handlePressFutureUnstakingFee = () => {
    Airship.show<'ok' | undefined>(bridge => (
      <ButtonsModal
        bridge={bridge}
        title={s.strings.stake_future_unstaking_fee}
        message={s.strings.stake_future_unstaking_fee_message}
        buttons={{
          ok: { label: s.strings.string_ok }
        }}
      />
    ))
  }

  const handlePressBreakEvenDays = () => {
    Airship.show<'ok' | undefined>(bridge => (
      <ButtonsModal
        bridge={bridge}
        title={s.strings.stake_break_even_time}
        message={s.strings.stake_break_even_time_message}
        buttons={{
          ok: { label: s.strings.string_ok }
        }}
      />
    ))
  }

  // Renderers
  const theme = useTheme()
  const styles = getStyles(theme)

  const renderEditableQuoteAmountRow = (allocationType: 'stake' | 'unstake' | 'claim', asset: { pluginId: string; currencyCode: string }) => {
    const { pluginId, currencyCode } = asset
    const quoteAllocation: QuoteAllocation | undefined =
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

  const renderStakeFeeAmountRow = (modification: ChangeQuoteRequest['action'], asset: { pluginId: string; currencyCode: string }) => {
    if (!(modification === 'stake' || modification === 'unstake' || modification === 'claim')) return null
    const { pluginId, currencyCode } = asset
    const quoteAllocation: QuoteAllocation | undefined =
      changeQuote != null
        ? changeQuote.allocations.find(
            allocation => allocation.allocationType === 'deductedFee' && allocation.pluginId === pluginId && allocation.currencyCode === currencyCode
          )
        : undefined
    if (quoteAllocation == null) return null

    const quoteDenom = getDenominationFromCurrencyInfo(wallet.currencyInfo, currencyCode)
    const title = modification === 'stake' ? s.strings.stake_estimated_staking_fee : s.strings.stake_estimated_unstaking_fee

    return (
      <CryptoFiatAmountTile
        type="questionable"
        title={title}
        nativeCryptoAmount={quoteAllocation?.nativeAmount ?? '0'}
        walletId={walletId}
        denomination={quoteDenom}
        onPress={handlePressStakingFee(modification)}
      />
    )
  }

  const renderFutureUnstakeFeeAmountRow = (modification: ChangeQuoteRequest['action'], asset: { pluginId: string; currencyCode: string }) => {
    if (modification !== 'stake') return null
    const { pluginId, currencyCode } = asset
    const quoteAllocation: QuoteAllocation | undefined =
      changeQuote != null
        ? changeQuote.allocations.find(
            allocation => allocation.allocationType === 'futureUnstakeFee' && allocation.pluginId === pluginId && allocation.currencyCode === currencyCode
          )
        : undefined
    if (quoteAllocation == null) return null

    const quoteDenom = getDenominationFromCurrencyInfo(wallet.currencyInfo, currencyCode)

    return (
      <CryptoFiatAmountTile
        type="questionable"
        title={s.strings.stake_future_unstaking_fee}
        nativeCryptoAmount={quoteAllocation?.nativeAmount ?? '0'}
        walletId={walletId}
        denomination={quoteDenom}
        onPress={handlePressFutureUnstakingFee}
      />
    )
  }

  const renderBreakEvenDays = () => {
    const { breakEvenDays = 0 } = quoteInfo ?? {}
    const months = toFixed(toBigNumberString(breakEvenDays / 30), 1, 1)
    const days = toFixed(toBigNumberString(breakEvenDays), 0, 0)

    let message: string
    if (breakEvenDays > 60) {
      message = sprintf(s.strings.stake_break_even_days_months_s, days, months)
    } else {
      message = sprintf(s.strings.stake_break_even_days_s, days)
    }
    return (
      <Tile type="questionable" title={s.strings.stake_break_even_time} contentPadding={false} onPress={handlePressBreakEvenDays}>
        <EdgeText>{message}</EdgeText>
      </Tile>
    )
  }

  const renderWarning = () => {
    // Warnings are only shown for single asset staking
    let warningMessage = null
    if (existingAllocations?.staked.length === 1 && changeQuote !== null) {
      const modStakedAmount =
        changeQuoteAllocations.find(allocation => allocation.allocationType === 'stake' && gt(allocation.nativeAmount, '0'))?.nativeAmount || '0'
      const stakedAmount = existingAllocations?.staked[0].nativeAmount ?? '0'

      const isRemainingStakedAmount = gt(stakedAmount, modStakedAmount)

      if (modification === 'stake') {
        if (stakeWarning === null) return null
        warningMessage = stakeWarning ?? s.strings.stake_warning_stake
      }
      if (modification === 'claim') {
        if (claimWarning === null) return null
        warningMessage = claimWarning ?? s.strings.stake_warning_claim
      }
      if (modification === 'unstake') {
        if (unstakeWarning === null) return null
        warningMessage = unstakeWarning ?? isRemainingStakedAmount ? s.strings.stake_warning_unstake : null
      }
    }
    return warningMessage == null ? null : (
      <Alert marginRem={[0, 1, 1, 1]} title={s.strings.wc_smartcontract_warning_title} message={warningMessage} numberOfLines={0} type="warning" />
    )
  }

  const renderChangeQuoteAmountTiles = (modification: ChangeQuoteRequest['action']) => {
    const networkFeeQuote = changeQuoteAllocations.find(allocation => allocation.allocationType === 'networkFee')

    return (
      <View style={styles.amountTilesContainer}>
        <IconTile title={s.strings.wc_smartcontract_wallet} iconUri={getCurrencyIconUris(wallet.currencyInfo.pluginId).symbolImage}>
          <EdgeText>{getWalletName(wallet)}</EdgeText>
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
          // Render stake/unstake fee tiles
          stakePolicy.stakeAssets.map(asset => renderStakeFeeAmountRow(modification, asset))
        }
        {
          // Render network fee tile
          <CryptoFiatAmountTile
            title={s.strings.wc_smartcontract_network_fee}
            nativeCryptoAmount={networkFeeQuote?.nativeAmount ?? '0'}
            walletId={walletId}
            // @ts-expect-error
            currencyCode={networkFeeQuote?.currencyCode}
            denomination={nativeAssetDenomination}
          />
        }
        {
          // Render stake/unstake fee tiles
          stakePolicy.stakeAssets.map(asset => renderFutureUnstakeFeeAmountRow(modification, asset))
        }
        {quoteInfo?.breakEvenDays != null ? renderBreakEvenDays() : null}
        {errorMessage === '' || sliderLocked ? null : <ErrorTile message={errorMessage} />}
      </View>
    )
  }

  const sceneTitleMap = React.useMemo(
    () => ({
      stake: getPolicyTitleName(stakePolicy),
      claim: s.strings.stake_claim_rewards,
      unstake: s.strings.stake_unstake_claim,
      unstakeExact: '' // Only for internal use
    }),
    [stakePolicy]
  )

  const policyIcons = getPolicyIconUris(wallet.currencyInfo, stakePolicy)
  const icon = React.useMemo(
    () => (modification === 'stake' ? null : <Image style={styles.icon} source={{ uri: policyIcons.rewardAssetUris[0] }} />),
    [modification, policyIcons.rewardAssetUris, styles.icon]
  )

  const sceneHeader = React.useMemo(
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

  const isSliderDisabled = sliderLocked || changeQuote == null || !changeQuote.allocations.some(quoteAllocation => gt(quoteAllocation.nativeAmount, '0'))

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

const getStyles = cacheStyles((theme: Theme) => ({
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
