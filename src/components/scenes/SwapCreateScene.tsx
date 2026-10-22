import { gt, gte } from 'biggystring'
import {
  asMaybeInsufficientFundsError,
  asMaybeSwapAboveLimitError,
  asMaybeSwapBelowLimitError,
  asMaybeSwapCurrencyError,
  asMaybeSwapPermissionError,
  type EdgeCurrencyWallet,
  type EdgeSwapRequest,
  type EdgeTokenId
} from 'edge-core-js'
import * as React from 'react'
import { useState } from 'react'
import { Keyboard, View } from 'react-native'
import { sprintf } from 'sprintf-js'

import {
  type DisableAsset,
  isAssetDisabled
} from '../../actions/ExchangeInfoActions'
import {
  checkEnabledExchanges,
  setStealthSwapEnabled
} from '../../actions/SettingsActions'
import { getSpecialCurrencyInfo } from '../../constants/WalletAndCurrencyConstants'
import { useSwapRequestOptions } from '../../hooks/swap/useSwapRequestOptions'
import { useHandler } from '../../hooks/useHandler'
import { useLinkPromoRelease } from '../../hooks/useLinkPromoRelease'
import { useTabBlur } from '../../hooks/useTabBlur'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { useDispatch, useSelector } from '../../types/reactRedux'
import type { NavigationBase, SwapTabSceneProps } from '../../types/routerTypes'
import { getCurrencyCode } from '../../util/CurrencyInfoHelpers'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import {
  getHoudiniAssets,
  getHoudiniAssetSupport,
  type HoudiniChains
} from '../../util/houdiniChains'
import {
  getStealthDisableAssets,
  getStealthProviderName,
  makeStealthSwapRequestOptions
} from '../../util/stealthSwap'
import type { SwapErrorDisplayInfo } from '../../util/swapErrorDisplay'
import { zeroString } from '../../util/utils'
import { EdgeButton } from '../buttons/EdgeButton'
import { KavButtons } from '../buttons/KavButtons'
import { SceneButtons } from '../buttons/SceneButtons'
import { AlertCardUi4 } from '../cards/AlertCard'
import { EdgeCard } from '../cards/EdgeCard'
import {
  EdgeAnim,
  fadeInDown30,
  fadeInDown60,
  fadeInDown90,
  fadeInUp60
} from '../common/EdgeAnim'
import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { SceneWrapper } from '../common/SceneWrapper'
import { styled } from '../hoc/styled'
import { SwapVerticalIcon } from '../icons/ThemedIcons'
import { SceneContainer } from '../layout/SceneContainer'
import {
  WalletListModal,
  type WalletListResult
} from '../modals/WalletListModal'
import { Airship, showToast, showWarning } from '../services/AirshipInstance'
import { useTheme } from '../services/ThemeContext'
import { SettingsSwitchRow } from '../settings/SettingsSwitchRow'
import { UnscaledText } from '../text/UnscaledText'
import { LineTextDivider } from '../themed/LineTextDivider'
import { StealthInfoText } from '../themed/StealthInfoText'
import {
  SwapInput,
  type SwapInputCardAmounts,
  type SwapInputCardInputRef
} from '../themed/SwapInput'
import { ButtonBox } from '../themed/ThemedButtons'

export interface SwapCreateParams {
  // The following props are used to populate the flip inputs
  fromWalletId?: string | undefined
  fromTokenId?: EdgeTokenId
  toWalletId?: string | undefined
  toTokenId?: EdgeTokenId

  // Display error message in an alert card
  errorDisplayInfo?: SwapErrorDisplayInfo

  // Sets the Stealth Swap toggle for this visit, in place of the account's
  // saved choice. The scene applies it once and clears it, and never saves it.
  stealth?: boolean
}

interface Props extends SwapTabSceneProps<'swapCreate'> {}

/** One side of the selected pair, as the Stealth block check reads it. */
interface StealthSwapSide {
  currencyCode: string
  tokenId: EdgeTokenId
  wallet: EdgeCurrencyWallet | undefined
}

export const SwapCreateScene: React.FC<Props> = props => {
  const { navigation, route } = props
  const {
    fromWalletId,
    fromTokenId = null,
    toWalletId,
    toTokenId = null,
    errorDisplayInfo,
    stealth: stealthParam
  } = route.params ?? {}
  const theme = useTheme()
  const dispatch = useDispatch()

  // An `edge://exchange/swap` link credits its promo to this one entry into
  // the swap flow, so leaving the tab without swapping gives the credit back.
  useLinkPromoRelease(navigation, 'swapTab')

  // Input state is the state of the user input
  const [inputNativeAmount, setInputNativeAmount] = useState('0')
  const [inputFiatAmount, setInputFiatAmount] = useState('0')
  const [inputNativeAmountFor, setInputNativeAmountFor] = useState<
    'from' | 'to'
  >('from')

  // Stealth Swap: when enabled, the quote routes through the Houdini privacy
  // provider as a fixed provider (see SwapConfirmationScene). The toggle shows
  // the account's saved choice, unless a `stealth` param set it for this visit.
  const stealthSwapEnabled = useSelector(
    state => state.ui.settings.stealthSwapEnabled
  )
  const [stealthOverride, setStealthOverride] = useState<boolean | undefined>(
    stealthParam
  )

  const fromInputRef = React.useRef<SwapInputCardInputRef>(null)
  const toInputRef = React.useRef<SwapInputCardInputRef>(null)

  const swapRequestOptions = useSwapRequestOptions()

  const account = useSelector(state => state.core.account)
  const currencyWallets = useWatch(account, 'currencyWallets')
  const exchangeInfo = useSelector(state => state.ui.exchangeInfo)
  const houdiniChains = useSelector(state => state.ui.houdiniChains)
  // Until the info server serves Houdini's list there is nothing a Stealth
  // Swap could route, so the toggle stays hidden and reads as off:
  const stealthAvailable = houdiniChains.size > 0

  const toWallet: EdgeCurrencyWallet | undefined =
    toWalletId == null ? undefined : currencyWallets[toWalletId]
  const fromWallet: EdgeCurrencyWallet | undefined =
    fromWalletId == null ? undefined : currencyWallets[fromWalletId]

  const toWalletName = toWallet == null ? '' : getWalletName(toWallet)
  const fromWalletName = fromWallet == null ? '' : getWalletName(fromWallet)
  const fromCurrencyCode =
    fromWallet == null ? '' : getCurrencyCode(fromWallet, fromTokenId)
  const toCurrencyCode =
    toWallet == null ? '' : getCurrencyCode(toWallet, toTokenId)

  // Why a Stealth Swap cannot route the selected pair, or `undefined` when it
  // can: a side Houdini does not serve, or one the info server bans for it on
  // that side, the sending side named first. No route is probed before the
  // quote, so a provider that cannot quote a served pair still fails at Next.
  // Before the list loads nothing is known to be unserved, so nothing blocks.
  const stealthDisableAssets = getStealthDisableAssets(
    exchangeInfo.swap.disableAssets,
    exchangeInfo.swap.disableAssetsByPlugin
  )
  const stealthBlockedCurrencyCode = getStealthBlockedCurrencyCode({
    bans: stealthDisableAssets,
    from: {
      currencyCode: fromCurrencyCode,
      tokenId: fromTokenId,
      wallet: fromWallet
    },
    houdiniChains,
    to: { currencyCode: toCurrencyCode, tokenId: toTokenId, wallet: toWallet }
  })
  const stealthBlockedReason =
    stealthBlockedCurrencyCode == null
      ? undefined
      : sprintf(
          lstrings.stealth_asset_unsupported_1s,
          stealthBlockedCurrencyCode
        )
  // A blocked pair reads as off without touching the saved choice, which
  // comes back once the user picks a pair Stealth can route:
  const stealth =
    (stealthOverride ?? stealthSwapEnabled) &&
    stealthAvailable &&
    stealthBlockedReason == null

  const fromWalletSpecialCurrencyInfo = getSpecialCurrencyInfo(
    fromWallet?.currencyInfo.pluginId ?? ''
  )
  const fromWalletBalanceMap =
    fromWallet?.balanceMap ?? new Map<string, string>()

  const fromHeaderText =
    fromWallet == null ? lstrings.select_src_wallet : fromWalletName
  const toHeaderText =
    toWallet == null ? lstrings.select_recv_wallet : toWalletName
  // Determines if a coin can have Exchange Max option
  const hasMaxSpend =
    fromWallet != null && fromWalletSpecialCurrencyInfo.noMaxSpend !== true

  const isNextHidden =
    // Don't show next button if the wallets haven't been selected:
    fromWallet == null ||
    toWallet == null ||
    // Don't show next button if the amount is zero:
    zeroString(inputNativeAmount) ||
    // Don't show next button if the amount exceeds the balance:
    checkAmountExceedsBalance()

  //
  // Effects
  //

  React.useEffect(() => {
    return navigation.addListener('focus', () => {
      dispatch(checkEnabledExchanges())
    })
  }, [dispatch, navigation])

  // This tab stays mounted, so a caller can navigate here with `stealth` long
  // after the first render. The param is consumed rather than kept: the other
  // `setParams` calls on this scene merge into the route params, and a
  // lingering value would put the toggle back every time one of them ran.
  React.useEffect(() => {
    if (stealthParam == null) return
    setStealthOverride(stealthParam)
    navigation.setParams({ stealth: undefined })
  }, [navigation, stealthParam])

  // The visit ends when the user switches tabs, and the saved choice is back
  // the next time they open Swap.
  useTabBlur(navigation, 'swapTab', () => {
    setStealthOverride(undefined)
  })

  //
  // Callbacks
  //

  /** Potentially clear an error if swap parameters relevant to the error have
   * been user-modified. */
  const getNewErrorInfo = (
    changed: 'amount' | 'asset'
  ): { errorDisplayInfo?: SwapErrorDisplayInfo } => {
    const { error } = errorDisplayInfo ?? {}
    const isInsufficentFunds = asMaybeInsufficientFundsError(error) != null
    const isSwapAboveLimit = asMaybeSwapAboveLimitError(error) != null
    const isSwapBelowLimit = asMaybeSwapBelowLimitError(error) != null
    const isSwapPermission = asMaybeSwapPermissionError(error) != null
    const isSwapCurrency = asMaybeSwapCurrencyError(error) != null

    let clearError = false

    // Unknown error, clear it no matter what the user changes.
    if (!(error instanceof Error) || error.name == null) {
      clearError = true
    }
    // Amount related errors
    else if (
      changed === 'amount' &&
      (isInsufficentFunds || isSwapAboveLimit || isSwapBelowLimit)
    ) {
      clearError = true
    }
    // Selected asset related errors (arbitrarily includes all amount-related
    // errors as well)
    else if (
      changed === 'asset' &&
      (isSwapPermission ||
        isSwapCurrency ||
        isInsufficentFunds ||
        isSwapAboveLimit ||
        isSwapBelowLimit)
    ) {
      clearError = true
    }

    return { errorDisplayInfo: clearError ? undefined : errorDisplayInfo }
  }

  function checkAmountExceedsBalance(): boolean {
    // If no from wallet, return false:
    if (fromWallet == null) return false
    // We do not know what the from amount is if we are quoting "to" a
    // specific amount. Therefore we always return false in this case.
    if (inputNativeAmountFor === 'to') return false
    // Get the balance:
    const fromWalletBalance = fromWalletBalanceMap.get(fromTokenId) ?? '0'
    // If there is a balance and the amount is greater than the balance,
    // return true (which means amount exceeded balance).
    return (
      gte(fromWalletBalance, '0') && gt(inputNativeAmount, fromWalletBalance)
    )
  }

  const getQuote = (swapRequest: EdgeSwapRequest): void => {
    if (exchangeInfo != null) {
      // A Stealth Swap asks Houdini alone, so Houdini's own bans refuse the
      // pair here too. Left to the core, a pair no enabled provider can quote
      // fails with an internal error rather than this message:
      const disableAssets = stealth
        ? stealthDisableAssets
        : exchangeInfo.swap.disableAssets
      const disableSrc = isAssetDisabled(
        disableAssets.source,
        swapRequest.fromWallet.currencyInfo.pluginId,
        fromTokenId
      )
      if (disableSrc) {
        showToast(
          sprintf(
            lstrings.swap_token_no_enabled_exchanges_2s,
            fromCurrencyCode,
            swapRequest.fromWallet.currencyInfo.displayName
          )
        )
        return
      }

      const disableDest = isAssetDisabled(
        disableAssets.destination,
        swapRequest.toWallet.currencyInfo.pluginId,
        toTokenId
      )
      if (disableDest) {
        showToast(
          sprintf(
            lstrings.swap_token_no_enabled_exchanges_2s,
            toCurrencyCode,
            swapRequest.toWallet.currencyInfo.displayName
          )
        )
        return
      }
    }
    // Clear the error state:
    navigation.setParams({
      errorDisplayInfo: undefined
    })

    // Start request for quote. A stealth swap restricts the request to the
    // Houdini privacy provider AND demands a private route: restricting the
    // provider alone would still accept that provider's transparent standard
    // routes, which are priced better and would be labelled private here.
    // The restriction also queries Houdini when it is switched off in Exchange
    // Settings, a setting only a swap with Stealth off honors.
    const quoteRequest: EdgeSwapRequest = stealth
      ? { ...swapRequest, privacy: 'required' }
      : swapRequest
    const quoteRequestOptions = stealth
      ? makeStealthSwapRequestOptions(account, swapRequestOptions)
      : swapRequestOptions
    navigation.navigate('swapProcessing', {
      swapRequest: quoteRequest,
      swapRequestOptions: quoteRequestOptions,
      onCancel: () => {
        navigation.goBack()
      },
      onDone: quotes => {
        navigation.replace('swapConfirmation', {
          selectedQuote: quotes[0],
          quotes,
          onApprove: resetState,
          onStealthTermsDeclined: handleStealthTermsDeclined,
          swapRequest: quoteRequest,
          swapRequestOptions: quoteRequestOptions
        })
      }
    })
  }

  const resetState = (): void => {
    setInputNativeAmount('0')
    setInputFiatAmount('0')
    setInputNativeAmountFor('from')
  }

  const showWalletListModal = async (
    whichWallet: 'from' | 'to'
  ): Promise<void> => {
    // A Stealth Swap asks the Houdini provider alone, so its pickers offer
    // only what that provider serves: each served chain's coin and the tokens
    // on its list, less what the info server bans for it on that side. An
    // asset selected before the toggle went on that Stealth cannot route
    // turns the toggle off with its reason instead.
    const allowedAssets = stealth
      ? getHoudiniAssets({
          bans:
            whichWallet === 'to'
              ? stealthDisableAssets.destination
              : stealthDisableAssets.source,
          currencyConfigs: account.currencyConfig,
          houdiniChains
        })
      : undefined
    const result = await Airship.show<WalletListResult>(bridge => (
      <WalletListModal
        bridge={bridge}
        navigation={navigation as NavigationBase}
        headerTitle={
          whichWallet === 'to'
            ? lstrings.select_recv_wallet
            : lstrings.select_src_wallet
        }
        showCreateWallet={whichWallet === 'to'}
        allowKeysOnlyMode={whichWallet === 'from'}
        allowedAssets={allowedAssets}
        filterActivation
      />
    ))
    if (result?.type === 'wallet') {
      const { walletId, tokenId } = result
      await handleSelectWallet(walletId, tokenId, whichWallet)
    }
  }

  //
  // Handlers
  //

  const handleFlipWalletPress = useHandler(() => {
    // Flip params:
    navigation.setParams({
      fromWalletId: toWalletId,
      fromTokenId: toTokenId,
      toWalletId: fromWalletId,
      toTokenId: fromTokenId,
      // Update the error state:
      ...getNewErrorInfo('asset')
    })

    // Clear amount input state:
    setInputNativeAmountFor(inputNativeAmountFor === 'from' ? 'to' : 'from')

    // Swap the amounts:
    // Use setTimeout to allow the component's state to change before making
    // the imperative state changes.
    setTimeout(() => {
      if (inputNativeAmountFor === 'from') {
        fromInputRef.current?.setAmount('fiat', '0')
        toInputRef.current?.setAmount('fiat', inputFiatAmount)
      } else {
        toInputRef.current?.setAmount('fiat', '0')
        fromInputRef.current?.setAmount('fiat', inputFiatAmount)
      }
    }, 0)
  })

  const handleSelectWallet = useHandler(
    async (
      walletId: string,
      tokenId: EdgeTokenId,
      direction: 'from' | 'to'
    ) => {
      navigation.setParams({
        ...(direction === 'to'
          ? {
              toWalletId: walletId,
              toTokenId: tokenId
            }
          : {
              fromWalletId: walletId,
              fromTokenId: tokenId
            }),
        // Update the error state:
        ...getNewErrorInfo('asset')
      })

      // Make sure to update the values if the wallet change is for the input
      // field that has a native amount:
      if (direction === 'from' && inputNativeAmountFor === 'from') {
        fromInputRef.current?.triggerConvertValue()
      }
      if (direction === 'to' && inputNativeAmountFor === 'to') {
        toInputRef.current?.triggerConvertValue()
      }
    }
  )

  const handleMaxPress = useHandler(() => {
    if (toWallet == null) {
      showWarning(lstrings.exchange_select_receiving_wallet, {
        trackError: false
      })
      return
    }

    if (fromWallet == null) {
      // Shouldn't ever happen because max button UI is disabled when no
      // fromWallet is selected
      showWarning(lstrings.exchange_select_sending_wallet, {
        trackError: false
      })
      return
    }

    const request: EdgeSwapRequest = {
      fromTokenId,
      fromWallet,
      nativeAmount: '0',
      quoteFor: 'max',
      toTokenId,
      toWallet
    }

    getQuote(request)
  })

  const handleNext = useHandler(() => {
    // Should only happen if the user initiated the swap from the keyboard
    if (fromWallet == null || toWallet == null) return

    if (zeroString(inputNativeAmount)) {
      showToast(
        `${lstrings.no_exchange_amount}. ${lstrings.select_exchange_amount}.`
      )
      return
    }

    const request: EdgeSwapRequest = {
      fromTokenId,
      fromWallet,
      nativeAmount: inputNativeAmount,
      quoteFor: inputNativeAmountFor,
      toTokenId,
      toWallet
    }

    if (checkAmountExceedsBalance()) return

    getQuote(request)
  })

  const handleFromSelectWallet = useHandler(async () => {
    await showWalletListModal('from')
  })

  const handleToSelectWallet = useHandler(async () => {
    await showWalletListModal('to')
  })

  const handleCancelKeyPress = useHandler(() => {
    Keyboard.dismiss()
  })

  // A tap is the user's choice, so it is saved, and it replaces any param
  // override at once rather than waiting on the settings write. The row stays
  // locked until the save lands, so a second tap cannot race it. A pair
  // Stealth cannot route refuses the tap with its reason and saves nothing.
  const handleToggleStealth = useHandler(async (): Promise<void> => {
    if (stealthBlockedReason != null) {
      showToast(stealthBlockedReason)
      return
    }
    setStealthOverride(!stealth)
    await dispatch(setStealthSwapEnabled(account, !stealth))
  })

  // Declining the stealth provider's terms backs out to this scene with the
  // toggle off, so the next tap on the button asks for an ordinary swap
  // instead of walking straight back into the same terms modal. Turning the
  // toggle back on brings the modal back, until the terms are accepted. The
  // decline only lasts this visit, so the saved choice is left alone.
  const handleStealthTermsDeclined = useHandler(() => {
    setStealthOverride(false)
  })

  const handleFromAmountChange = useHandler((amounts: SwapInputCardAmounts) => {
    navigation.setParams({
      // Update the error state:
      ...getNewErrorInfo('amount')
    })

    setInputNativeAmount(amounts.nativeAmount)
    setInputFiatAmount(amounts.fiatAmount)
    setInputNativeAmountFor('from')
    // Clear other input's amount:
    toInputRef.current?.setAmount('crypto', '0')
  })

  const handleToAmountChange = useHandler((amounts: SwapInputCardAmounts) => {
    navigation.setParams({
      // Update the error state:
      ...getNewErrorInfo('amount')
    })

    setInputNativeAmount(amounts.nativeAmount)
    setInputFiatAmount(amounts.fiatAmount)
    setInputNativeAmountFor('to')
    // Clear other input's amount:
    fromInputRef.current?.setAmount('crypto', '0')
  })

  //
  // Render
  //

  const renderAlert = (): React.ReactElement | null => {
    const { minimumPopupModals } = fromWalletSpecialCurrencyInfo
    const primaryNativeBalance = fromWalletBalanceMap.get(fromTokenId) ?? '0'

    if (
      minimumPopupModals != null &&
      primaryNativeBalance < minimumPopupModals.minimumNativeBalance
    ) {
      return (
        <AlertCardUi4
          title={lstrings.request_minimum_notification_title}
          body={minimumPopupModals.alertMessage}
          type="warning"
        />
      )
    }

    if (errorDisplayInfo != null) {
      return (
        <AlertCardUi4
          title={errorDisplayInfo.title}
          body={errorDisplayInfo.message}
          type="error"
        />
      )
    }

    if (checkAmountExceedsBalance()) {
      return (
        <AlertCardUi4
          title={lstrings.exchange_insufficient_funds_title}
          body={lstrings.exchange_insufficient_funds_below_balance}
          type="error"
        />
      )
    }

    return null
  }

  return (
    <SceneWrapper
      hasTabs
      hasNotifications
      scroll
      keyboardShouldPersistTaps="handled"
      dockProps={{
        keyboardVisibleOnly: true,
        children: (
          <KavButtons
            primary={{
              label: lstrings.string_next_capitalized,
              onPress: handleNext,
              disabled: isNextHidden
            }}
            tertiary={{
              label: lstrings.string_cancel_cap,
              onPress: handleCancelKeyPress
            }}
          />
        )
      }}
    >
      {({ isKeyboardOpen }) => (
        <SceneContainer>
          <EdgeAnim enter={fadeInUp60}>
            {fromWallet == null ? (
              <EdgeButton
                type="secondary"
                onPress={handleFromSelectWallet}
                marginRem={[1, 0]}
                label={lstrings.select_src_wallet}
              />
            ) : (
              <SwapInput
                ref={fromInputRef}
                heading={lstrings.exchange_title_sending}
                forceField="fiat"
                walletPlaceholderText={fromHeaderText}
                keyboardVisible={false}
                onAmountChanged={handleFromAmountChange}
                onNext={handleNext}
                onSelectWallet={handleFromSelectWallet}
                placeholders={[
                  isNextHidden ? lstrings.string_tap_to_edit : fromCurrencyCode,
                  isNextHidden ? '' : lstrings.string_tap_next_for_quote
                ]}
                tokenId={fromTokenId}
                wallet={fromWallet}
                walletPillTestID="swapFromWalletPill"
              />
            )}
          </EdgeAnim>
          <EdgeAnim>
            <LineTextDivider lowerCased>
              <ButtonBox onPress={handleFlipWalletPress} paddingRem={[0, 0.5]}>
                <SwapVerticalIcon
                  color={theme.iconTappable}
                  size={theme.rem(2)}
                />
              </ButtonBox>
              {hasMaxSpend ? (
                <MaxButtonContainerView>
                  <EdgeTouchableOpacity onPress={handleMaxPress}>
                    <MaxButtonText>{lstrings.string_max_cap}</MaxButtonText>
                  </EdgeTouchableOpacity>
                </MaxButtonContainerView>
              ) : null}
            </LineTextDivider>
          </EdgeAnim>
          <EdgeAnim enter={fadeInDown30}>
            {toWallet == null ? (
              <EdgeButton
                type="secondary"
                onPress={handleToSelectWallet}
                marginRem={[1, 0]}
                label={lstrings.select_recv_wallet}
              />
            ) : (
              <SwapInput
                ref={toInputRef}
                forceField="fiat"
                walletPlaceholderText={toHeaderText}
                keyboardVisible={false}
                onAmountChanged={handleToAmountChange}
                onNext={handleNext}
                onSelectWallet={handleToSelectWallet}
                placeholders={[
                  isNextHidden ? lstrings.string_tap_to_edit : toCurrencyCode,
                  isNextHidden ? '' : lstrings.string_tap_next_for_quote
                ]}
                tokenId={toTokenId}
                wallet={toWallet}
                walletPillTestID="swapToWalletPill"
                heading={lstrings.exchange_title_receiving}
              />
            )}
          </EdgeAnim>
          {stealthAvailable ? (
            <EdgeAnim enter={fadeInDown60}>
              <EdgeCard sections>
                <SettingsSwitchRow
                  label={lstrings.stealth_swap_toggle}
                  value={stealth}
                  disabled={stealthBlockedReason != null}
                  onPress={handleToggleStealth}
                />
                {stealthBlockedReason != null ? (
                  <StealthInfoText message={stealthBlockedReason} />
                ) : stealth ? (
                  <StealthInfoText
                    message={sprintf(
                      lstrings.stealth_info_1s,
                      getStealthProviderName(account)
                    )}
                    showLearnMore
                  />
                ) : null}
              </EdgeCard>
            </EdgeAnim>
          ) : null}
          <EdgeAnim enter={fadeInDown60}>{renderAlert()}</EdgeAnim>
          <EdgeAnim enter={fadeInDown90}>
            {isNextHidden || isKeyboardOpen ? null : (
              <SceneButtons
                primary={{
                  label: lstrings.string_next_capitalized,
                  onPress: handleNext
                }}
              />
            )}
          </EdgeAnim>
        </SceneContainer>
      )}
    </SceneWrapper>
  )
}

const MaxButtonContainerView = styled(View)(theme => ({
  position: 'absolute',
  right: theme.rem(1),
  top: -theme.rem(0.5)
}))

const MaxButtonText = styled(UnscaledText)(theme => ({
  color: theme.escapeButtonText,
  fontFamily: theme.fontFaceDefault,
  fontSize: theme.rem(0.75),
  includeFontPadding: false
}))

/**
 * True when Houdini serves the wallet's asset and the info server has not
 * banned it for Houdini on this side of the swap.
 */
function isStealthRoutable(opts: {
  bans: DisableAsset[]
  houdiniChains: HoudiniChains
  tokenId: EdgeTokenId
  wallet: EdgeCurrencyWallet
}): boolean {
  const { bans, houdiniChains, tokenId, wallet } = opts
  const { pluginId } = wallet.currencyInfo
  return (
    getHoudiniAssetSupport({ asset: { pluginId, tokenId }, houdiniChains }) !=
      null && !isAssetDisabled(bans, pluginId, tokenId)
  )
}

/**
 * The currency code of the side a Stealth Swap cannot route, the sending side
 * first, or `undefined` when it can. A side not picked yet blocks nothing, and
 * neither does anything before Houdini's list loads, since nothing is known to
 * be unserved until then.
 */
function getStealthBlockedCurrencyCode(opts: {
  bans: { source: DisableAsset[]; destination: DisableAsset[] }
  from: StealthSwapSide
  houdiniChains: HoudiniChains
  to: StealthSwapSide
}): string | undefined {
  const { bans, from, houdiniChains, to } = opts
  if (houdiniChains.size === 0) return undefined
  if (
    from.wallet != null &&
    !isStealthRoutable({
      bans: bans.source,
      houdiniChains,
      tokenId: from.tokenId,
      wallet: from.wallet
    })
  ) {
    return from.currencyCode
  }
  if (
    to.wallet != null &&
    !isStealthRoutable({
      bans: bans.destination,
      houdiniChains,
      tokenId: to.tokenId,
      wallet: to.wallet
    })
  ) {
    return to.currencyCode
  }
  return undefined
}
