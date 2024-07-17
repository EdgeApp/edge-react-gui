import { gt, gte } from 'biggystring'
import { EdgeCurrencyWallet, EdgeSwapRequest, EdgeTokenId } from 'edge-core-js'
import * as React from 'react'
import { useState } from 'react'
import { Text, View } from 'react-native'
import { sprintf } from 'sprintf-js'

import { DisableAsset } from '../../actions/ExchangeInfoActions'
import { checkEnabledExchanges } from '../../actions/SettingsActions'
import { updateMostRecentWalletsSelected } from '../../actions/WalletActions'
import { getSpecialCurrencyInfo } from '../../constants/WalletAndCurrencyConstants'
import { useSwapRequestOptions } from '../../hooks/swap/useSwapRequestOptions'
import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
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
import { Airship, showError, showToast, showWarning } from '../services/AirshipInstance'
import { useTheme } from '../services/ThemeContext'
import { ExchangedFlipInputAmounts, ExchangedFlipInputRef } from '../themed/ExchangedFlipInput2'
import { LineTextDivider } from '../themed/LineTextDivider'
import { SwapInput } from '../themed/SwapInput'
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
}

interface Props extends EdgeSceneProps<'swapCreate'> {}

interface State {
  nativeAmount: string
  fiatAmount: string
  nativeAmountFor: 'from' | 'to'
}

const defaultState: State = {
  nativeAmount: '0',
  fiatAmount: '0',
  nativeAmountFor: 'from'
}

export const SwapCreateScene = (props: Props) => {
  const { navigation, route } = props
  const { fromWalletId, fromTokenId = null, toWalletId, toTokenId = null, errorDisplayInfo } = route.params ?? {}
  const theme = useTheme()
  const dispatch = useDispatch()

  const [state, setState] = useState({
    ...defaultState
  })

  const fromInputRef = React.useRef<ExchangedFlipInputRef>(null)
  const toInputRef = React.useRef<ExchangedFlipInputRef>(null)

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
    zeroString(state.nativeAmount) ||
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
    if (state.nativeAmountFor === 'to') return false
    // Get the balance:
    const fromWalletBalance = fromWalletBalanceMap.get(fromTokenId) ?? '0'
    // If there is a balance and the amount is greater than the balance,
    // return true (which means amount exceeded balance).
    return gte(fromWalletBalance, '0') && gt(state.nativeAmount, fromWalletBalance)
  }

  const getQuote = (swapRequest: EdgeSwapRequest) => {
    if (exchangeInfo != null) {
      const disableSrc = checkDisableAsset(exchangeInfo.swap.disableAssets.source, swapRequest.fromWallet.id, fromTokenId)
      if (disableSrc) {
        showError(sprintf(lstrings.exchange_asset_unsupported, fromCurrencyCode))
        return
      }

      const disableDest = checkDisableAsset(exchangeInfo.swap.disableAssets.destination, swapRequest.toWallet.id, toTokenId)
      if (disableDest) {
        showError(sprintf(lstrings.exchange_asset_unsupported, toCurrencyCode))
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
    setState(defaultState)
  }

  const showWalletListModal = async (whichWallet: 'from' | 'to') => {
    const result = await Airship.show<WalletListResult>(bridge => (
      <WalletListModal
        bridge={bridge}
        navigation={props.navigation}
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
      errorDisplayInfo
    })
    const newNativeAmountFor = state.nativeAmountFor === 'from' ? 'to' : 'from'
    // Clear amount input state:
    setState({
      ...state,
      nativeAmountFor: newNativeAmountFor
    })
    // Swap the amounts:
    const toAmount = newNativeAmountFor === 'to' ? state.fiatAmount : '0'
    const fromAmount = newNativeAmountFor === 'from' ? state.fiatAmount : '0'
    toInputRef.current?.setAmount('fiat', toAmount)
    fromInputRef.current?.setAmount('fiat', fromAmount)
  })

  const handleSelectWallet = useHandler(async (walletId: string, tokenId: EdgeTokenId, direction: 'from' | 'to') => {
    const params = {
      ...route.params,
      ...(direction === 'to'
        ? {
            toWalletId: walletId,
            toTokenId: tokenId
          }
        : {
            fromWalletId: walletId,
            fromTokenId: tokenId
          })
    }
    navigation.setParams(params)
    dispatch(updateMostRecentWalletsSelected(walletId, tokenId))
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

    if (zeroString(state.nativeAmount)) {
      showToast(`${lstrings.no_exchange_amount}. ${lstrings.select_exchange_amount}.`)
      return
    }

    const request: EdgeSwapRequest = {
      fromTokenId: fromTokenId,
      fromWallet: fromWallet,
      nativeAmount: state.nativeAmount,
      quoteFor: state.nativeAmountFor,
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

  const handleFromAmountChange = useHandler((amounts: ExchangedFlipInputAmounts) => {
    setState({
      ...state,
      nativeAmount: amounts.nativeAmount,
      fiatAmount: amounts.fiatAmount,
      nativeAmountFor: 'from'
    })
    // Clear other input's amount:
    toInputRef.current?.setAmount('crypto', '0')
  })

  const handleToAmountChange = useHandler((amounts: ExchangedFlipInputAmounts) => {
    setState({
      ...state,
      nativeAmount: amounts.nativeAmount,
      fiatAmount: amounts.fiatAmount,
      nativeAmountFor: 'to'
    })
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
