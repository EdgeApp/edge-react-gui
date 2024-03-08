import { gt, gte } from 'biggystring'
import { EdgeAccount, EdgeCurrencyWallet, EdgeSwapRequest, EdgeTokenId } from 'edge-core-js'
import * as React from 'react'
import { useState } from 'react'
import { Keyboard } from 'react-native'
import { sprintf } from 'sprintf-js'

import { selectWalletForExchange } from '../../actions/CryptoExchangeActions'
import { DisableAsset, ExchangeInfo } from '../../actions/ExchangeInfoActions'
import { updateMostRecentWalletsSelected } from '../../actions/WalletActions'
import { getSpecialCurrencyInfo } from '../../constants/WalletAndCurrencyConstants'
import { useSwapRequestOptions } from '../../hooks/swap/useSwapRequestOptions'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { EdgeSceneProps, NavigationBase } from '../../types/routerTypes'
import { emptyCurrencyInfo, GuiCurrencyInfo } from '../../types/types'
import { getTokenId, getWalletTokenId } from '../../util/CurrencyInfoHelpers'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import { zeroString } from '../../util/utils'
import { EdgeAnim, fadeInDown30, fadeInDown60, fadeInDown90, fadeInUp60, fadeInUp90 } from '../common/EdgeAnim'
import { SceneWrapper } from '../common/SceneWrapper'
import { WalletListModal, WalletListResult } from '../modals/WalletListModal'
import { Airship, showError, showWarning } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { CryptoExchangeFlipInput } from '../themed/CryptoExchangeFlipInput'
import { ExchangedFlipInputAmounts } from '../themed/ExchangedFlipInput2'
import { LineTextDivider } from '../themed/LineTextDivider'
import { MiniButton } from '../themed/MiniButton'
import { SceneHeader } from '../themed/SceneHeader'
import { AlertCardUi4 } from '../ui4/AlertCardUi4'
import { ButtonsViewUi4 } from '../ui4/ButtonsViewUi4'

export interface SwapErrorDisplayInfo {
  message: string
  title: string
}

interface OwnProps extends EdgeSceneProps<'exchange'> {}

interface StateProps {
  account: EdgeAccount
  exchangeInfo: ExchangeInfo

  // The following props are used to populate the CryptoExchangeFlipInputs
  fromWalletInfo: FromWalletInfo
  toWalletInfo: ToWalletInfo
}

interface FromWalletInfo {
  fromWallet?: EdgeCurrencyWallet
  fromPluginId: string
  fromTokenId: EdgeTokenId
  fromWalletId: string
  fromWalletBalanceMap: Map<EdgeTokenId, string>
  fromWalletName: string
  fromWalletPrimaryInfo: GuiCurrencyInfo
  // Used to populate the confirmation modal
  fromCurrencyCode: string
}

interface ToWalletInfo {
  toWallet?: EdgeCurrencyWallet
  toTokenId: EdgeTokenId
  toWalletId: string
  toWalletName: string
  toWalletPrimaryInfo: GuiCurrencyInfo
  // Used to populate the confirmation modal
  toCurrencyCode: string
}

interface DispatchProps {
  onSelectWallet: (walletId: string, tokenId: EdgeTokenId, direction: 'from' | 'to') => Promise<void>
  getQuoteForTransaction: (navigation: NavigationBase, request: EdgeSwapRequest, onApprove: () => void) => void
}

type Props = OwnProps & StateProps & DispatchProps

interface State {
  whichWalletFocus: 'from' | 'to' // Which wallet FlipInput2 was last focused and edited
  fromAmountNative: string
  toAmountNative: string
  paddingBottom: number
}

const defaultFromWalletInfo: FromWalletInfo = {
  fromPluginId: '',
  fromTokenId: null,
  fromCurrencyCode: '',
  fromWalletBalanceMap: new Map<EdgeTokenId, string>(),
  fromWalletName: '',
  fromWalletPrimaryInfo: emptyCurrencyInfo,
  fromWalletId: ''
}

const defaultToWalletInfo: ToWalletInfo = {
  toTokenId: null,
  toCurrencyCode: '',
  toWalletName: '',
  toWalletPrimaryInfo: emptyCurrencyInfo,
  toWalletId: ''
}

const defaultState: State = {
  whichWalletFocus: 'from',
  fromAmountNative: '',
  toAmountNative: '',
  paddingBottom: 0
}

export const CryptoExchangeComponent = (props: Props) => {
  const { route } = props
  const { errorDisplayInfo } = route.params ?? {}
  const theme = useTheme()
  const styles = getStyles(theme)

  const [state, setState] = useState({
    ...defaultState
  })

  const checkDisableAsset = (disableAssets: DisableAsset[], walletId: string, guiCurrencyInfo: GuiCurrencyInfo): boolean => {
    const wallet = props.account.currencyWallets[walletId] ?? { currencyInfo: {} }
    const walletPluginId = wallet.currencyInfo.pluginId
    const walletTokenId = guiCurrencyInfo.tokenId ?? getTokenId(props.account, walletPluginId, guiCurrencyInfo.exchangeCurrencyCode)
    for (const disableAsset of disableAssets) {
      const { pluginId, tokenId } = disableAsset
      if (pluginId !== walletPluginId) continue
      if (tokenId === walletTokenId) return true
      if (tokenId === 'allCoins') return true
      if (tokenId === 'allTokens' && walletTokenId != null) return true
    }
    return false
  }

  const handleMax = () => {
    if (props.toWalletInfo.toWallet == null) {
      showWarning(`${lstrings.loan_select_receiving_wallet}`)
      Keyboard.dismiss()
      return
    }

    if (props.fromWalletInfo.fromWallet == null) {
      // Should never happen because max button UI is hidden unless a source wallet is selected
      throw new Error('No wallet selected')
    }

    const request: EdgeSwapRequest = {
      fromTokenId: props.fromWalletInfo.fromTokenId,
      fromWallet: props.fromWalletInfo.fromWallet,
      nativeAmount: '0',
      quoteFor: 'max',
      toTokenId: props.toWalletInfo.toTokenId,
      toWallet: props.toWalletInfo.toWallet
    }

    getQuote(request)
  }

  const handleNext = () => {
    if (props.fromWalletInfo.fromWallet == null || props.toWalletInfo.toWallet == null) {
      // Should never happen because next UI is hidden unless both source/destination wallets are selected
      throw new Error('No wallet selected')
    }

    const request: EdgeSwapRequest = {
      fromTokenId: props.fromWalletInfo.fromTokenId,
      fromWallet: props.fromWalletInfo.fromWallet,
      nativeAmount: state.whichWalletFocus === 'from' ? state.fromAmountNative : state.toAmountNative,
      quoteFor: state.whichWalletFocus,
      toTokenId: props.toWalletInfo.toTokenId,
      toWallet: props.toWalletInfo.toWallet
    }

    if (zeroString(request.nativeAmount)) {
      showError(`${lstrings.no_exchange_amount}. ${lstrings.select_exchange_amount}.`)
      return
    }

    if (checkExceedsAmount()) return

    getQuote(request)
  }

  const getQuote = (request: EdgeSwapRequest) => {
    const { exchangeInfo, navigation } = props
    if (exchangeInfo != null) {
      const disableSrc = checkDisableAsset(
        exchangeInfo.swap.disableAssets.source,
        props.fromWalletInfo.fromWalletId,
        props.fromWalletInfo.fromWalletPrimaryInfo
      )
      if (disableSrc) {
        showError(sprintf(lstrings.exchange_asset_unsupported, props.fromWalletInfo.fromWalletPrimaryInfo.exchangeCurrencyCode))
        return
      }

      const disableDest = checkDisableAsset(exchangeInfo.swap.disableAssets.destination, props.toWalletInfo.toWalletId, props.toWalletInfo.toWalletPrimaryInfo)
      if (disableDest) {
        showError(sprintf(lstrings.exchange_asset_unsupported, props.toWalletInfo.toWalletPrimaryInfo.exchangeCurrencyCode))
        return
      }
    }
    props.getQuoteForTransaction(navigation, request, resetState)
    Keyboard.dismiss()
  }

  const resetState = () => {
    setState(defaultState)
  }

  const checkExceedsAmount = (): boolean => {
    const { fromTokenId, fromWalletBalanceMap } = props.fromWalletInfo
    const { fromAmountNative, whichWalletFocus } = state
    const fromNativeBalance = fromWalletBalanceMap.get(fromTokenId) ?? '0'

    return whichWalletFocus === 'from' && gte(fromNativeBalance, '0') && gt(fromAmountNative, fromNativeBalance)
  }

  const launchFromWalletSelector = () => {
    renderDropUp('from')
  }

  const launchToWalletSelector = () => {
    renderDropUp('to')
  }

  const focusFromWallet = () => {
    setState({
      ...state,
      whichWalletFocus: 'from'
    })
  }

  const focusToWallet = () => {
    setState({
      ...state,
      whichWalletFocus: 'to'
    })
  }

  const fromAmountChanged = (amounts: ExchangedFlipInputAmounts) => {
    setState({
      ...state,
      fromAmountNative: amounts.nativeAmount
    })
  }

  const toAmountChanged = (amounts: ExchangedFlipInputAmounts) => {
    setState({
      ...state,
      toAmountNative: amounts.nativeAmount
    })
  }

  const renderButton = () => {
    const primaryNativeAmount = state.whichWalletFocus === 'from' ? state.fromAmountNative : state.toAmountNative
    const showNext = props.fromWalletInfo.fromCurrencyCode !== '' && props.toWalletInfo.toCurrencyCode !== '' && !!parseFloat(primaryNativeAmount)
    if (!showNext) return null
    if (checkExceedsAmount()) return null
    return <ButtonsViewUi4 primary={{ label: lstrings.string_next_capitalized, onPress: handleNext }} parentType="scene" />
  }

  const renderAlert = () => {
    const { fromPluginId, fromWalletBalanceMap, fromTokenId } = props.fromWalletInfo

    const { minimumPopupModals } = getSpecialCurrencyInfo(fromPluginId)
    const primaryNativeBalance = fromWalletBalanceMap.get(fromTokenId) ?? '0'

    if (minimumPopupModals != null && primaryNativeBalance < minimumPopupModals.minimumNativeBalance) {
      return <AlertCardUi4 title={lstrings.request_minimum_notification_title} body={minimumPopupModals.alertMessage} type="warning" />
    }

    if (errorDisplayInfo != null) {
      return <AlertCardUi4 title={errorDisplayInfo.title} body={errorDisplayInfo.message} type="error" />
    }

    if (checkExceedsAmount()) {
      return <AlertCardUi4 title={lstrings.exchange_insufficient_funds_title} body={lstrings.exchange_insufficient_funds_below_balance} type="error" />
    }

    return null
  }

  const renderDropUp = (whichWallet: 'from' | 'to') => {
    Airship.show<WalletListResult>(bridge => (
      <WalletListModal
        bridge={bridge}
        navigation={props.navigation}
        headerTitle={whichWallet === 'to' ? lstrings.select_recv_wallet : lstrings.select_src_wallet}
        showCreateWallet={whichWallet === 'to'}
        allowKeysOnlyMode={whichWallet === 'from'}
        filterActivation
      />
    ))
      .then(async result => {
        if (result?.type === 'wallet') {
          const { walletId, tokenId } = result
          await props.onSelectWallet(walletId, tokenId, whichWallet)
        }
      })
      .catch(error => showError(error))
  }

  const { fromWalletName } = props.fromWalletInfo
  const { toWalletName } = props.toWalletInfo

  const isFromFocused = state.whichWalletFocus === 'from'
  const isToFocused = state.whichWalletFocus === 'to'
  const fromHeaderText = sprintf(lstrings.exchange_from_wallet, fromWalletName)
  const toHeaderText = sprintf(lstrings.exchange_to_wallet, toWalletName)
  // Determines if a coin can have Exchange Max option
  const hasMaxSpend = getSpecialCurrencyInfo(props.fromWalletInfo.fromPluginId).noMaxSpend !== true

  return (
    <SceneWrapper hasTabs hasNotifications scroll keyboardShouldPersistTaps="handled" padding={theme.rem(0.5)}>
      <EdgeAnim style={styles.header} enter={fadeInUp90}>
        <SceneHeader title={lstrings.title_exchange} underline />
      </EdgeAnim>
      <EdgeAnim enter={fadeInUp60}>
        <CryptoExchangeFlipInput
          wallet={props.fromWalletInfo.fromWallet}
          buttonText={lstrings.select_src_wallet}
          headerText={fromHeaderText}
          primaryCurrencyInfo={props.fromWalletInfo.fromWalletPrimaryInfo}
          overridePrimaryNativeAmount={state.fromAmountNative}
          launchWalletSelector={launchFromWalletSelector}
          onCryptoExchangeAmountChanged={fromAmountChanged}
          isFocused={isFromFocused}
          focusMe={focusFromWallet}
          onNext={handleNext}
        >
          {hasMaxSpend ? <MiniButton label={lstrings.string_max_cap} marginRem={[0.5, 0, 0.75]} onPress={handleMax} alignSelf="center" /> : null}
        </CryptoExchangeFlipInput>
      </EdgeAnim>
      <EdgeAnim>
        <LineTextDivider title={lstrings.string_to_capitalize} lowerCased />
      </EdgeAnim>
      <EdgeAnim enter={fadeInDown30}>
        <CryptoExchangeFlipInput
          wallet={props.toWalletInfo.toWallet}
          buttonText={lstrings.select_recv_wallet}
          headerText={toHeaderText}
          primaryCurrencyInfo={props.toWalletInfo.toWalletPrimaryInfo}
          overridePrimaryNativeAmount={state.toAmountNative}
          launchWalletSelector={launchToWalletSelector}
          onCryptoExchangeAmountChanged={toAmountChanged}
          isFocused={isToFocused}
          focusMe={focusToWallet}
          onNext={handleNext}
        />
      </EdgeAnim>
      <EdgeAnim enter={fadeInDown60}>{renderAlert()}</EdgeAnim>
      <EdgeAnim enter={fadeInDown90}>{renderButton()}</EdgeAnim>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  mainScrollView: {
    flex: 1
  },
  header: {
    marginLeft: -theme.rem(0.5),
    width: '100%',
    marginVertical: theme.rem(1)
  },
  scrollViewContentContainer: {
    alignItems: 'center',
    marginHorizontal: theme.rem(0.5)
  }
}))

export const CryptoExchangeScene = (props: OwnProps) => {
  const dispatch = useDispatch()
  const { navigation, route } = props

  const account = useSelector(state => state.core.account)
  const currencyWallets = useSelector(state => state.core.account.currencyWallets)
  const cryptoExchange = useSelector(state => state.cryptoExchange)
  const exchangeInfo = useSelector(state => state.ui.exchangeInfo)

  const swapRequestOptions = useSwapRequestOptions()

  const { fromWalletId, toWalletId } = cryptoExchange

  let fromWalletInfo = defaultFromWalletInfo
  let toWalletInfo = defaultToWalletInfo

  if (fromWalletId != null && currencyWallets[fromWalletId] != null) {
    const fromWallet = currencyWallets[fromWalletId]
    const { fromWalletPrimaryInfo } = cryptoExchange
    const { exchangeCurrencyCode } = fromWalletPrimaryInfo
    const fromTokenId = getWalletTokenId(fromWallet, exchangeCurrencyCode)

    const fromWalletName = getWalletName(fromWallet)
    const { balanceMap: fromWalletBalanceMap } = fromWallet

    fromWalletInfo = {
      fromWallet,
      fromTokenId,
      fromWalletId,
      fromWalletName,
      fromWalletBalanceMap,
      fromCurrencyCode: exchangeCurrencyCode,
      fromWalletPrimaryInfo,
      fromPluginId: fromWallet.currencyInfo.pluginId
    }
  }

  // Get the values of the 'To' Wallet
  if (toWalletId != null && currencyWallets[toWalletId] != null) {
    const toWallet = currencyWallets[toWalletId]
    const { toWalletPrimaryInfo } = cryptoExchange
    const { exchangeCurrencyCode } = toWalletPrimaryInfo
    const toTokenId = getWalletTokenId(toWallet, exchangeCurrencyCode)

    const toWalletName = getWalletName(toWallet)

    toWalletInfo = {
      toWallet,
      toTokenId,
      toWalletId,
      toWalletName,
      toCurrencyCode: exchangeCurrencyCode,
      toWalletPrimaryInfo
    }
  }

  const handleSelectWallet = useHandler(async (walletId: string, tokenId: EdgeTokenId, direction: 'from' | 'to') => {
    await dispatch(selectWalletForExchange(walletId, tokenId, direction))
    dispatch(updateMostRecentWalletsSelected(walletId, tokenId))
  })

  const handleGetQuoteForTransaction = useHandler((navigation: NavigationBase, swapRequest: EdgeSwapRequest, onApprove: () => void) => {
    navigation.navigate('exchangeQuoteProcessing', {
      swapRequest,
      swapRequestOptions,
      onCancel: () => {
        navigation.goBack()
      },
      onDone: quotes => {
        navigation.replace('exchangeQuote', {
          selectedQuote: quotes[0],
          quotes,
          onApprove
        })
      }
    })
  })

  return (
    <CryptoExchangeComponent
      route={route}
      onSelectWallet={handleSelectWallet}
      getQuoteForTransaction={handleGetQuoteForTransaction}
      navigation={navigation}
      account={account}
      exchangeInfo={exchangeInfo}
      fromWalletInfo={fromWalletInfo}
      toWalletInfo={toWalletInfo}
    />
  )
}
