import { eq, gt, toFixed } from 'biggystring'
import { EdgeCurrencyWallet, EdgeTokenId, InsufficientFundsError } from 'edge-core-js'
import * as React from 'react'
import { Image, View } from 'react-native'
import { sprintf } from 'sprintf-js'

import { lstrings } from '../../../locales/strings'
import {
  ChangeQuote,
  ChangeQuoteRequest,
  QuoteAllocation,
  StakeBelowLimitError,
  StakePlugin,
  StakePolicy,
  StakePoolFullError,
  StakePosition
} from '../../../plugins/stake-plugins/types'
import { getDisplayDenomination, getExchangeDenominationFromAccount } from '../../../selectors/DenominationSelectors'
import { useSelector } from '../../../types/reactRedux'
import { EdgeSceneProps } from '../../../types/routerTypes'
import { getCurrencyIconUris } from '../../../util/CdnUris'
import { getTokenIdForced, getWalletTokenId } from '../../../util/CurrencyInfoHelpers'
import { getWalletName } from '../../../util/CurrencyWalletHelpers'
import { getPolicyIconUris, getPositionAllocations } from '../../../util/stakeUtils'
import { toBigNumberString } from '../../../util/toBigNumberString'
import { zeroString } from '../../../util/utils'
import { SceneWrapper } from '../../common/SceneWrapper'
import { withWallet } from '../../hoc/withWallet'
import { ButtonsModal } from '../../modals/ButtonsModal'
import { FlipInputModal2, FlipInputModalResult } from '../../modals/FlipInputModal2'
import { FlashNotification } from '../../navigation/FlashNotification'
import { FillLoader } from '../../progress-indicators/FillLoader'
import { Airship, showError } from '../../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../../services/ThemeContext'
import { Alert } from '../../themed/Alert'
import { EdgeText } from '../../themed/EdgeText'
import { SceneHeader } from '../../themed/SceneHeader'
import { Slider } from '../../themed/Slider'
import { CryptoFiatAmountTile } from '../../tiles/CryptoFiatAmountTile'
import { EditableAmountTile } from '../../tiles/EditableAmountTile'
import { ErrorTile } from '../../tiles/ErrorTile'
import { CardUi4 } from '../../ui4/CardUi4'
import { RowUi4 } from '../../ui4/RowUi4'

export interface StakeModifyParams {
  title: string
  stakePlugin: StakePlugin
  walletId: string
  stakePolicy: StakePolicy
  stakePosition: StakePosition
  modification: ChangeQuoteRequest['action']
}

interface Props extends EdgeSceneProps<'stakeModify'> {
  wallet: EdgeCurrencyWallet
}

// TODO: Check contentPadding

const StakeModifySceneComponent = (props: Props) => {
  const { navigation, route, wallet } = props
  const { modification, title, stakePlugin, stakePolicy, stakePosition } = route.params
  const { stakeWarning, unstakeWarning, claimWarning, disableMaxStake, mustMaxUnstake } = stakePolicy
  const existingAllocations = React.useMemo(() => getPositionAllocations(stakePosition), [stakePosition])

  // Hooks
  const guiExchangeRates = useSelector(state => state.exchangeRates)
  const nativeAssetDenomination = useSelector(state => getDisplayDenomination(state, wallet.currencyInfo.pluginId, wallet.currencyInfo.currencyCode))

  // ChangeQuote that gets rendered in the rows
  const [changeQuote, setChangeQuote] = React.useState<ChangeQuote | null>(null)
  const changeQuoteAllocations = changeQuote?.allocations ?? []
  const { quoteInfo } = changeQuote ?? {}

  // Request that the user will modify, triggering a ChangeQuote recalculation
  const account = useSelector(state => state.core.account)
  const [changeQuoteRequest, setChangeQuoteRequest] = React.useState<ChangeQuoteRequest>({
    action: modification,
    stakePolicyId: stakePolicy.stakePolicyId,
    currencyCode: '',
    nativeAmount: '0',
    wallet,
    account
  })

  // Slider state
  const [sliderLocked, setSliderLocked] = React.useState(false)

  // Error message tile contents
  const [errorMessage, setErrorMessage] = React.useState('')

  React.useEffect(() => {
    // Initialize the claim row since the user would never modify the amount
    if (modification === 'claim' && changeQuoteRequest.nativeAmount === '0') {
      setChangeQuoteRequest({
        ...changeQuoteRequest,
        currencyCode: stakePolicy.rewardAssets[0].currencyCode,
        nativeAmount: existingAllocations.earned[0].nativeAmount
      })
    } else if (modification === 'unstake' && mustMaxUnstake) {
      setChangeQuoteRequest({
        ...changeQuoteRequest,
        currencyCode: stakePolicy.rewardAssets[0].currencyCode,
        nativeAmount: existingAllocations?.staked[0]?.nativeAmount
      })
    }

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
            let errMessage = changeQuoteRequest.action === 'stake' ? lstrings.stake_error_stake_below_minimum : lstrings.stake_error_unstake_below_minimum
            if (nativeMin != null) {
              wallet
                .nativeToDenomination(nativeMin, currencyCode)
                .then(minExchangeAmount => {
                  errMessage += `: ${minExchangeAmount} ${currencyCode}`
                  setErrorMessage(errMessage)
                })
                .catch(err => {
                  showError(err)
                  setErrorMessage(errMessage)
                })
            } else {
              setErrorMessage(errMessage)
            }
          } else if (err instanceof StakePoolFullError) {
            const { currencyCode } = err
            const errMessage = sprintf(lstrings.state_error_pool_full_s, currencyCode)
            setErrorMessage(errMessage)
          } else if (err instanceof InsufficientFundsError) {
            setErrorMessage(lstrings.exchange_insufficient_funds_title)
          } else {
            showError(err)
            setErrorMessage(lstrings.unknown_error_occurred_fragment)
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
  }, [changeQuoteRequest, wallet, stakePlugin])

  //
  // Handlers
  //

  const existingStaked = existingAllocations.staked ?? []
  const handleMaxButtonPress = (modCurrencyCode: string) => () => {
    // TODO: Move max amountlogic into stake plugin
    if (changeQuoteRequest != null) {
      if (modification === 'unstake') {
        const allocationToMod = existingStaked.find(positionAllocation => positionAllocation.currencyCode === modCurrencyCode)
        if (allocationToMod == null) throw new Error(`Existing stake not found for ${modCurrencyCode}`)
        setChangeQuoteRequest({ ...changeQuoteRequest, currencyCode: modCurrencyCode, nativeAmount: allocationToMod.nativeAmount })
      } else if (modification === 'stake' && existingStaked.length === 1) {
        const tokenId = getWalletTokenId(wallet, modCurrencyCode)
        setChangeQuoteRequest({ ...changeQuoteRequest, currencyCode: modCurrencyCode, nativeAmount: wallet.balanceMap.get(tokenId) ?? '0' })
      }
    }
  }

  const handleSlideComplete = (reset: () => void) => {
    const message = {
      stake: lstrings.stake_change_stake_success,
      unstake: lstrings.stake_change_unstake_success,
      claim: lstrings.stake_change_claim_success,
      unstakeExact: ''
    }

    if (changeQuote != null) {
      setSliderLocked(true)
      changeQuote
        .approve()
        .then(async () => {
          await Airship.show(bridge => <FlashNotification bridge={bridge} message={message[modification]} onPress={() => {}} />)
          navigation.pop()
        })
        .catch(err => {
          reset()
          showError(err)
          setErrorMessage(lstrings.unknown_error_occurred_fragment)
        })
        .finally(() => {
          setSliderLocked(false)
        })
    }
  }

  const handleShowFlipInputModal = (currencyCode: string, tokenId: EdgeTokenId) => () => {
    const header = modification === 'stake' ? lstrings.stake_modal_modify_stake_title : lstrings.stake_modal_modify_unstake_title

    // TODO: Max button needs to be enabled after max calculation for
    // multi-asset staking is fully implemented and working in plugin
    // Also disable if the policy explicity disables it.
    const hideMaxButton = existingStaked.length > 1 || (disableMaxStake ?? false)

    Airship.show<FlipInputModalResult>(bridge => (
      <FlipInputModal2
        bridge={bridge}
        wallet={wallet}
        tokenId={tokenId}
        feeTokenId={null}
        startNativeAmount={eq(changeQuoteRequest.nativeAmount, '0') ? undefined : changeQuoteRequest.nativeAmount}
        onAmountsChanged={() => {}}
        onMaxSet={handleMaxButtonPress(currencyCode)}
        headerText={sprintf(header, getWalletName(wallet))}
        hideMaxButton={hideMaxButton}
      />
    ))
      .then(({ nativeAmount, exchangeAmount }) => {
        // set the modified amount
        if (nativeAmount !== '0') setChangeQuoteRequest({ ...changeQuoteRequest, currencyCode, nativeAmount })
      })
      .catch(error => showError(error))
  }

  const handlePressStakingFee = (modification: ChangeQuoteRequest['action']) => async () => {
    let title: string
    let message: string
    if (modification === 'stake') {
      title = lstrings.stake_estimated_staking_fee
      message = lstrings.stake_staking_fee_message
    } else {
      title = lstrings.stake_estimated_unstaking_fee
      message = lstrings.stake_unstaking_fee_message
    }

    await Airship.show<'ok' | undefined>(bridge => (
      <ButtonsModal
        bridge={bridge}
        title={title}
        message={message}
        buttons={{
          ok: { label: lstrings.string_ok }
        }}
      />
    ))
  }

  const handlePressFutureUnstakingFee = async () => {
    await Airship.show<'ok' | undefined>(bridge => (
      <ButtonsModal
        bridge={bridge}
        title={lstrings.stake_future_unstaking_fee}
        message={lstrings.stake_future_unstaking_fee_message}
        buttons={{
          ok: { label: lstrings.string_ok }
        }}
      />
    ))
  }

  const handlePressBreakEvenDays = async () => {
    await Airship.show<'ok' | undefined>(bridge => (
      <ButtonsModal
        bridge={bridge}
        title={lstrings.stake_break_even_time}
        message={lstrings.stake_break_even_time_message}
        buttons={{
          ok: { label: lstrings.string_ok }
        }}
      />
    ))
  }

  // Renderers
  const theme = useTheme()
  const styles = getStyles(theme)

  const renderEditableQuoteAmountRow = (allocationType: 'stake' | 'unstake' | 'claim', asset: { pluginId: string; currencyCode: string }) => {
    const { pluginId, currencyCode } = asset
    const tokenId = getTokenIdForced(account, pluginId, currencyCode)
    const quoteAllocation: QuoteAllocation | undefined =
      changeQuote != null
        ? changeQuote.allocations.find(
            allocation => allocationType === allocation.allocationType && allocation.pluginId === pluginId && allocation.currencyCode === currencyCode
          )
        : allocationType === 'unstake' && mustMaxUnstake
        ? { allocationType, pluginId: asset.pluginId, currencyCode: asset.currencyCode, nativeAmount: existingAllocations?.staked[0]?.nativeAmount ?? '0' }
        : undefined

    const quoteCurrencyCode = currencyCode
    const quoteDenom = getExchangeDenominationFromAccount(account, pluginId, quoteCurrencyCode)

    const isClaim = allocationType === 'claim'

    const title =
      allocationType === 'stake'
        ? sprintf(lstrings.stake_amount_s_stake, quoteCurrencyCode)
        : isClaim
        ? sprintf(lstrings.stake_amount_claim, quoteCurrencyCode)
        : sprintf(lstrings.stake_amount_s_unstake, quoteCurrencyCode)

    const nativeAmount = zeroString(quoteAllocation?.nativeAmount) ? '' : quoteAllocation?.nativeAmount ?? ''
    const { nativeAmount: earnedAmount = '0', locktime } = existingAllocations.earned[0] ?? {}
    if (isClaim && locktime != null && Date.now() < new Date(locktime).valueOf()) {
      return null
    }

    return (
      <CardUi4>
        <EditableAmountTile
          title={title}
          key={allocationType + pluginId + currencyCode}
          exchangeRates={guiExchangeRates}
          nativeAmount={isClaim ? earnedAmount : nativeAmount}
          wallet={wallet}
          currencyCode={quoteCurrencyCode}
          exchangeDenomination={quoteDenom}
          displayDenomination={quoteDenom}
          lockInputs={isClaim || (!!mustMaxUnstake && allocationType === 'unstake')}
          onPress={handleShowFlipInputModal(currencyCode, tokenId)}
        />
      </CardUi4>
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

    const quoteDenom = getExchangeDenominationFromAccount(account, pluginId, currencyCode)
    const title = modification === 'stake' ? lstrings.stake_estimated_staking_fee : lstrings.stake_estimated_unstaking_fee
    const tokenId = getTokenIdForced(account, pluginId, currencyCode)

    return (
      <CryptoFiatAmountTile
        type="questionable"
        title={title}
        nativeCryptoAmount={quoteAllocation?.nativeAmount ?? '0'}
        tokenId={tokenId}
        walletId={wallet.id}
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

    const quoteDenom = getExchangeDenominationFromAccount(account, pluginId, currencyCode)
    const tokenId = getTokenIdForced(account, pluginId, currencyCode)

    return (
      <CryptoFiatAmountTile
        type="questionable"
        title={lstrings.stake_future_unstaking_fee}
        nativeCryptoAmount={quoteAllocation?.nativeAmount ?? '0'}
        tokenId={tokenId}
        walletId={wallet.id}
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
      message = sprintf(lstrings.stake_break_even_days_months_s, days, months)
    } else {
      message = sprintf(lstrings.stake_break_even_days_s, days)
    }
    return (
      <CardUi4>
        <RowUi4 rightButtonType="questionable" title={lstrings.stake_break_even_time} onPress={handlePressBreakEvenDays}>
          <EdgeText>{message}</EdgeText>
        </RowUi4>
      </CardUi4>
    )
  }

  const renderWarning = () => {
    let warningMessage: string | null = null

    switch (modification) {
      case 'stake':
        if (stakeWarning == null) return null
        warningMessage = stakeWarning
        break
      case 'claim':
        if (claimWarning == null) return null
        warningMessage = claimWarning
        break
      case 'unstake':
        if (unstakeWarning == null) return null
        warningMessage = unstakeWarning
        break
      default:
        return null
    }

    return warningMessage == null ? null : (
      <Alert marginRem={[0, 1, 1, 1]} title={lstrings.wc_smartcontract_warning_title} message={warningMessage} numberOfLines={0} type="warning" />
    )
  }

  const renderChangeQuoteAmountTiles = (modification: ChangeQuoteRequest['action']) => {
    const networkFeeQuote = changeQuoteAllocations.find(allocation => allocation.allocationType === 'networkFee')

    return (
      <View style={styles.amountTilesContainer}>
        <CardUi4 icon={getCurrencyIconUris(wallet.currencyInfo.pluginId, null).symbolImage}>
          <RowUi4 title={lstrings.wc_smartcontract_wallet} body={getWalletName(wallet)} />
        </CardUi4>
        {
          // Render stake/unstake amount tiles
          modification === 'stake' || modification === 'unstake'
            ? stakePolicy.stakeAssets.map(asset => renderEditableQuoteAmountRow(modification, asset))
            : null
        }
        {
          // Render claim amount tile
          stakePolicy.hideClaimAction || (modification !== 'claim' && modification !== 'unstake')
            ? null
            : stakePolicy.rewardAssets.map(asset => renderEditableQuoteAmountRow('claim', asset))
        }
        {
          // Render stake/unstake fee tiles
          stakePolicy.stakeAssets.map(asset => renderStakeFeeAmountRow(modification, asset))
        }
        {
          // Render network fee tile
          <CryptoFiatAmountTile
            tokenId={null}
            title={lstrings.wc_smartcontract_network_fee}
            nativeCryptoAmount={networkFeeQuote?.nativeAmount ?? '0'}
            walletId={wallet.id}
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

  const policyIcons = getPolicyIconUris(wallet.currencyInfo, stakePolicy)
  const icon = React.useMemo(
    () => (modification === 'stake' ? null : <Image style={styles.icon} source={{ uri: policyIcons.rewardAssetUris[0] }} />),
    [modification, policyIcons.rewardAssetUris, styles.icon]
  )

  if (stakePosition.allocations.length === 0) {
    return (
      <SceneWrapper>
        <FillLoader />
      </SceneWrapper>
    )
  }

  const isSliderDisabled = sliderLocked || changeQuote == null || !changeQuote.allocations.some(quoteAllocation => gt(quoteAllocation.nativeAmount, '0'))

  return (
    <SceneWrapper padding={theme.rem(0.5)} scroll>
      <SceneHeader style={styles.sceneHeader} title={title} underline withTopMargin>
        {icon}
      </SceneHeader>
      {renderChangeQuoteAmountTiles(modification)}
      {renderWarning()}
      <View style={styles.footer}>
        <Slider onSlidingComplete={handleSlideComplete} disabled={isSliderDisabled} showSpinner={sliderLocked} disabledText={lstrings.stake_disabled_slider} />
      </View>
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
    marginBottom: theme.rem(1),
    marginTop: theme.rem(0.5)
  },
  footer: {
    marginBottom: theme.rem(2)
  }
}))

export const StakeModifyScene = withWallet(StakeModifySceneComponent)
