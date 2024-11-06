import { gt, gte } from 'biggystring'
import {
  asMaybeInsufficientFundsError,
  asMaybeSwapAboveLimitError,
  asMaybeSwapBelowLimitError,
  asMaybeSwapCurrencyError,
  asMaybeSwapPermissionError,
  EdgeCurrencyWallet,
  EdgeSwapRequest,
  EdgeTokenId
} from 'edge-core-js'
import * as React from 'react'
import { useState } from 'react'
import { Text, View } from 'react-native'
import { sprintf } from 'sprintf-js'

import { DisableAsset } from '../../actions/ExchangeInfoActions'
import { checkEnabledExchanges } from '../../actions/SettingsActions'
import { getSpecialCurrencyInfo } from '../../constants/WalletAndCurrencyConstants'
import { useSwapRequestOptions } from '../../hooks/swap/useSwapRequestOptions'
import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { NavigationBase, SwapTabSceneProps } from '../../types/routerTypes'
import { getCurrencyCode } from '../../util/CurrencyInfoHelpers'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import { zeroString } from '../../util/utils'
import { ButtonsView } from '../buttons/ButtonsView'
import { EdgeButton } from '../buttons/EdgeButton'
import { AlertCardUi4 } from '../cards/AlertCard'
import { EdgeAnim, fadeInDown30, fadeInDown60, fadeInDown90, fadeInUp60 } from '../common/EdgeAnim'
import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { SceneWrapper } from '../common/SceneWrapper'
import { styled } from '../hoc/styled'
import { SwapVerticalIcon } from '../icons/ThemedIcons'
import { WalletListModal, WalletListResult } from '../modals/WalletListModal'
import { Airship, showToast, showWarning } from '../services/AirshipInstance'
import { useTheme } from '../services/ThemeContext'
import { LineTextDivider } from '../themed/LineTextDivider'
import { SwapInput, SwapInputCardAmounts, SwapInputCardInputRef } from '../themed/SwapInput'
import { ButtonBox } from '../themed/ThemedButtons'

export interface SwapCreateParams {
  // The following props are used to populate the flip inputs
  fromWalletId?: string | undefined
  fromTokenId?: EdgeTokenId
  toWalletId?: string | undefined
  toTokenId?: EdgeTokenId

  // Display error message in an alert card
  errorDisplayInfo?: SwapErrorDisplayInfo
}

export interface SwapErrorDisplayInfo {
  message: string
  title: string
  error: unknown
}

interface Props extends SwapTabSceneProps<'swapCreate'> {}

export const SwapCreateScene = (props: Props) => {
  const { navigation, route } = props
  const { fromWalletId, fromTokenId = null, toWalletId, toTokenId = null, errorDisplayInfo } = route.params ?? {}
  const theme = useTheme()
  const dispatch = useDispatch()

  // Input state is the state of the user input
  const [inputNativeAmount, setInputNativeAmount] = useState('0')
  const [inputFiatAmount, setInputFiatAmount] = useState('0')
  const [inputNativeAmountFor, setInputNativeAmountFor] = useState<'from' | 'to'>('from')

  const fromInputRef = React.useRef<SwapInputCardInputRef>(null)
  const toInputRef = React.useRef<SwapInputCardInputRef>(null)

  const swapRequestOptions = useSwapRequestOptions()

  const account = useSelector(state => state.core.account)
  const currencyWallets = useWatch(account, 'currencyWallets')
  const exchangeInfo = useSelector(state => state.ui.exchangeInfo)

  const toWallet: EdgeCurrencyWallet | undefined = toWalletId == null ? undefined : currencyWallets[toWalletId]
  const fromWallet: EdgeCurrencyWallet | undefined = fromWalletId == null ? undefined : currencyWallets[fromWalletId]

  const toWalletName = toWallet == null ? '' : getWalletName(toWallet)
  const fromWalletName = fromWallet == null ? '' : getWalletName(fromWallet)
  const fromCurrencyCode = fromWallet == null ? '' : getCurrencyCode(fromWallet, fromTokenId)
  const toCurrencyCode = toWallet == null ? '' : getCurrencyCode(toWallet, toTokenId)

  const fromWalletSpecialCurrencyInfo = getSpecialCurrencyInfo(fromWallet?.currencyInfo.pluginId ?? '')
  const fromWalletBalanceMap = fromWallet?.balanceMap ?? new Map<string, string>()

  const fromHeaderText = fromWallet == null ? lstrings.select_src_wallet : fromWalletName
  const toHeaderText = toWallet == null ? lstrings.select_recv_wallet : toWalletName
  // Determines if a coin can have Exchange Max option
  const hasMaxSpend = fromWallet != null && fromWalletSpecialCurrencyInfo.noMaxSpend !== true

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

  //
  // Callbacks
  //

  /** Potentially clear an error if swap parameters relevant to the error have
   * been user-modified. */
  const getNewErrorInfo = (changed: 'amount' | 'asset'): { errorDisplayInfo?: SwapErrorDisplayInfo } => {
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
    else if (changed === 'amount' && (isInsufficentFunds || isSwapAboveLimit || isSwapBelowLimit)) {
      clearError = true
    }
    // Selected asset related errors (arbitrarily includes all amount-related
    // errors as well)
    else if (changed === 'asset' && (isSwapPermission || isSwapCurrency || isInsufficentFunds || isSwapAboveLimit || isSwapBelowLimit)) {
      clearError = true
    }

    return { errorDisplayInfo: clearError ? undefined : errorDisplayInfo }
  }

  const checkDisableAsset = (disableAssets: DisableAsset[], walletId: string, tokenId: EdgeTokenId): boolean => {
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
    return gte(fromWalletBalance, '0') && gt(inputNativeAmount, fromWalletBalance)
  }

  const getQuote = (swapRequest: EdgeSwapRequest) => {
    if (exchangeInfo != null) {
      const disableSrc = checkDisableAsset(exchangeInfo.swap.disableAssets.source, swapRequest.fromWallet.id, fromTokenId)
      if (disableSrc) {
        showToast(sprintf(lstrings.swap_token_no_enabled_exchanges_2s, fromCurrencyCode, swapRequest.fromWallet.currencyInfo.displayName))
        return
      }

      const disableDest = checkDisableAsset(exchangeInfo.swap.disableAssets.destination, swapRequest.toWallet.id, toTokenId)
      if (disableDest) {
        showToast(sprintf(lstrings.swap_token_no_enabled_exchanges_2s, toCurrencyCode, swapRequest.toWallet.currencyInfo.displayName))
        return
      }
    }
    // Clear the error state:
    navigation.setParams({
      ...route.params,
      errorDisplayInfo: undefined
    })

    // Start request for quote:
    navigation.navigate('swapProcessing', {
      swapRequest,
      swapRequestOptions,
      onCancel: () => {
        navigation.goBack()
      },
      onDone: quotes => {
        navigation.replace('swapConfirmation', {
          selectedQuote: quotes[0],
          quotes,
          onApprove: resetState
        })
      }
    })
  }

  const resetState = () => {
    setInputNativeAmount('0')
    setInputFiatAmount('0')
    setInputNativeAmountFor('from')
  }

  const showWalletListModal = async (whichWallet: 'from' | 'to') => {
    const result = await Airship.show<WalletListResult>(bridge => (
      <WalletListModal
        bridge={bridge}
        navigation={navigation as NavigationBase}
        headerTitle={whichWallet === 'to' ? lstrings.select_recv_wallet : lstrings.select_src_wallet}
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

  const handleSelectWallet = useHandler(async (walletId: string, tokenId: EdgeTokenId, direction: 'from' | 'to') => {
    navigation.setParams({
      ...route.params,
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
  })

  const handleMaxPress = useHandler(() => {
    if (toWallet == null) {
      showWarning(`${lstrings.exchange_select_receiving_wallet}`, { trackError: false })
      return
    }

    if (fromWallet == null) {
      // Shouldn't ever happen because max button UI is disabled when no
      // fromWallet is selected
      showWarning(`${lstrings.exchange_select_sending_wallet}`, { trackError: false })
      return
    }

    const request: EdgeSwapRequest = {
      fromTokenId: fromTokenId,
      fromWallet: fromWallet,
      nativeAmount: '0',
      quoteFor: 'max',
      toTokenId: toTokenId,
      toWallet: toWallet
    }

    getQuote(request)
  })

  const handleNext = useHandler(() => {
    // Should only happen if the user initiated the swap from the keyboard
    if (fromWallet == null || toWallet == null) return

    if (zeroString(inputNativeAmount)) {
      showToast(`${lstrings.no_exchange_amount}. ${lstrings.select_exchange_amount}.`)
      return
    }

    const request: EdgeSwapRequest = {
      fromTokenId: fromTokenId,
      fromWallet: fromWallet,
      nativeAmount: inputNativeAmount,
      quoteFor: inputNativeAmountFor,
      toTokenId: toTokenId,
      toWallet: toWallet
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

  const handleFromAmountChange = useHandler((amounts: SwapInputCardAmounts) => {
    navigation.setParams({
      ...route.params,
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
      ...route.params,
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

  const renderAlert = () => {
    const { minimumPopupModals } = fromWalletSpecialCurrencyInfo
    const primaryNativeBalance = fromWalletBalanceMap.get(fromTokenId) ?? '0'

    if (minimumPopupModals != null && primaryNativeBalance < minimumPopupModals.minimumNativeBalance) {
      return <AlertCardUi4 title={lstrings.request_minimum_notification_title} body={minimumPopupModals.alertMessage} type="warning" />
    }

    if (errorDisplayInfo != null) {
      return <AlertCardUi4 title={errorDisplayInfo.title} body={errorDisplayInfo.message} type="error" />
    }

    if (checkAmountExceedsBalance()) {
      return <AlertCardUi4 title={lstrings.exchange_insufficient_funds_title} body={lstrings.exchange_insufficient_funds_below_balance} type="error" />
    }

    return null
  }

  return (
    <SceneWrapper hasTabs hasNotifications scroll keyboardShouldPersistTaps="handled" padding={theme.rem(0.5)}>
      <EdgeAnim enter={fadeInUp60}>
        {fromWallet == null ? (
          <EdgeButton type="secondary" onPress={handleFromSelectWallet} marginRem={[1, 0]} label={lstrings.select_src_wallet} />
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
            placeholders={[isNextHidden ? lstrings.string_tap_to_edit : fromCurrencyCode, isNextHidden ? '' : lstrings.string_tap_next_for_quote]}
            tokenId={fromTokenId}
            wallet={fromWallet}
          />
        )}
      </EdgeAnim>
      <EdgeAnim>
        <LineTextDivider lowerCased>
          <ButtonBox onPress={handleFlipWalletPress} paddingRem={[0, 0.5]}>
            <SwapVerticalIcon color={theme.iconTappable} size={theme.rem(2)} />
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
          <EdgeButton type="secondary" onPress={handleToSelectWallet} marginRem={[1, 0]} label={lstrings.select_recv_wallet} />
        ) : (
          <SwapInput
            ref={toInputRef}
            forceField="fiat"
            walletPlaceholderText={toHeaderText}
            keyboardVisible={false}
            onAmountChanged={handleToAmountChange}
            onNext={handleNext}
            onSelectWallet={handleToSelectWallet}
            placeholders={[isNextHidden ? lstrings.string_tap_to_edit : toCurrencyCode, isNextHidden ? '' : lstrings.string_tap_next_for_quote]}
            tokenId={toTokenId}
            wallet={toWallet}
            heading={lstrings.exchange_title_receiving}
          />
        )}
      </EdgeAnim>
      <EdgeAnim enter={fadeInDown60}>{renderAlert()}</EdgeAnim>
      <EdgeAnim enter={fadeInDown90}>
        {isNextHidden ? null : <ButtonsView primary={{ label: lstrings.string_next_capitalized, onPress: handleNext }} parentType="scene" />}
      </EdgeAnim>
    </SceneWrapper>
  )
}

const MaxButtonContainerView = styled(View)(theme => ({
  position: 'absolute',
  right: theme.rem(1),
  top: -theme.rem(0.5)
}))

const MaxButtonText = styled(Text)(theme => ({
  color: theme.escapeButtonText,
  fontFamily: theme.fontFaceDefault,
  fontSize: theme.rem(0.75),
  includeFontPadding: false
}))
