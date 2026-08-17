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

import type { DisableAsset } from '../../actions/ExchangeInfoActions'
import { checkEnabledExchanges } from '../../actions/SettingsActions'
import { getSpecialCurrencyInfo } from '../../constants/WalletAndCurrencyConstants'
import { useSwapRequestOptions } from '../../hooks/swap/useSwapRequestOptions'
import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { useDispatch, useSelector } from '../../types/reactRedux'
import type { NavigationBase, SwapTabSceneProps } from '../../types/routerTypes'
import { getCurrencyCode } from '../../util/CurrencyInfoHelpers'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import {
  makeStealthSwapRequestOptions,
  requireDestinationWallet
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

  // Turn the Stealth Swap toggle off on arrival. The confirmation scene sets
  // this when a re-quote found the pair has no private route, so the degrade
  // lands where the toggle actually lives.
  disableStealth?: boolean
}

interface Props extends SwapTabSceneProps<'swapCreate'> {}

export const SwapCreateScene: React.FC<Props> = props => {
  const { navigation, route } = props
  const {
    fromWalletId,
    fromTokenId = null,
    toWalletId,
    toTokenId = null,
    errorDisplayInfo,
    disableStealth
  } = route.params ?? {}
  const theme = useTheme()
  const dispatch = useDispatch()

  // Input state is the state of the user input
  const [inputNativeAmount, setInputNativeAmount] = useState('0')
  const [inputFiatAmount, setInputFiatAmount] = useState('0')
  const [inputNativeAmountFor, setInputNativeAmountFor] = useState<
    'from' | 'to'
  >('from')

  // Stealth Swap: when enabled, the quote routes through the Houdini privacy
  // provider as a fixed provider (see SwapConfirmationScene).
  const [stealth, setStealth] = useState(false)

  const fromInputRef = React.useRef<SwapInputCardInputRef>(null)
  const toInputRef = React.useRef<SwapInputCardInputRef>(null)

  const swapRequestOptions = useSwapRequestOptions()

  const account = useSelector(state => state.core.account)
  const currencyWallets = useWatch(account, 'currencyWallets')
  const exchangeInfo = useSelector(state => state.ui.exchangeInfo)

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

  // A re-quote on the confirmation scene found no private route for the pair
  // and sent the user back here to retry as a standard swap. Consume the flag
  // so a later visit does not turn the toggle off again.
  React.useEffect(() => {
    if (disableStealth !== true) return
    setStealth(false)
    navigation.setParams({ disableStealth: undefined })
  }, [disableStealth, navigation])

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

  const checkDisableAsset = (
    disableAssets: DisableAsset[],
    walletId: string,
    tokenId: EdgeTokenId
  ): boolean => {
    const wallet = currencyWallets[walletId] ?? { currencyInfo: {} }
    const walletPluginId = wallet.currencyInfo.pluginId
    const walletTokenId = tokenId
    for (const disableAsset of disableAssets) {
      const { pluginId, tokenId } = disableAsset
      if (pluginId !== walletPluginId) continue
      if (tokenId === walletTokenId) return true
      if (tokenId === 'allCoins') return true
      if (tokenId === 'allTokens' && walletTokenId != null) return true
    }
    return false
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
    // This scene only builds wallet-to-wallet swap requests, which always carry
    // a destination wallet (swap-to-address has its own flow).
    const toWallet = requireDestinationWallet(swapRequest)
    if (exchangeInfo != null) {
      const disableSrc = checkDisableAsset(
        exchangeInfo.swap.disableAssets.source,
        swapRequest.fromWallet.id,
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

      const disableDest = checkDisableAsset(
        exchangeInfo.swap.disableAssets.destination,
        toWallet.id,
        toTokenId
      )
      if (disableDest) {
        showToast(
          sprintf(
            lstrings.swap_token_no_enabled_exchanges_2s,
            toCurrencyCode,
            toWallet.currencyInfo.displayName
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
    navigation.navigate('swapProcessing', {
      swapRequest: stealth
        ? { ...swapRequest, privacy: 'required' }
        : swapRequest,
      swapRequestOptions: stealth
        ? makeStealthSwapRequestOptions(account, swapRequestOptions)
        : swapRequestOptions,
      onCancel: () => {
        navigation.goBack()
      },
      onDone: quotes => {
        navigation.replace('swapConfirmation', {
          selectedQuote: quotes[0],
          quotes,
          onApprove: resetState,
          stealth
        })
      },
      onError: error => {
        // The provider has no private route for this pair: turn Stealth Swap
        // off, say why, and bring the user back to their filled-in request so
        // they can retry as a standard swap. Amount errors keep the generic
        // handling, since the route exists and the amount is the problem.
        if (!stealth || asMaybeSwapCurrencyError(error) == null) return false
        setStealth(false)
        showToast(lstrings.stealth_swap_route_unavailable_toast)
        navigation.navigate('swapTab', {
          screen: 'swapCreate',
          params: {
            fromWalletId: swapRequest.fromWallet.id,
            fromTokenId: swapRequest.fromTokenId,
            toWalletId: toWallet.id,
            toTokenId: swapRequest.toTokenId
          }
        })
        return true
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

  const handleToggleStealth = useHandler(() => {
    setStealth(value => !value)
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

  const renderAlert = (): React.ReactNode => {
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
                heading={lstrings.exchange_title_receiving}
              />
            )}
          </EdgeAnim>
          {fromWallet != null && toWallet != null ? (
            <EdgeAnim enter={fadeInDown60}>
              <EdgeCard sections>
                <SettingsSwitchRow
                  label={lstrings.stealth_swap_toggle}
                  value={stealth}
                  onPress={handleToggleStealth}
                />
                {stealth ? (
                  <StealthInfoText
                    message={lstrings.stealth_swap_info}
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
