import { gt, gte } from 'biggystring'
import { EdgeCurrencyWallet, EdgeSwapRequest, EdgeTokenId } from 'edge-core-js'
import * as React from 'react'
import { useState } from 'react'
import { Keyboard } from 'react-native'
import { sprintf } from 'sprintf-js'

import { DisableAsset } from '../../actions/ExchangeInfoActions'
import { updateMostRecentWalletsSelected } from '../../actions/WalletActions'
import { getSpecialCurrencyInfo } from '../../constants/WalletAndCurrencyConstants'
import { useSwapRequestOptions } from '../../hooks/swap/useSwapRequestOptions'
import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { selectDisplayDenom } from '../../selectors/DenominationSelectors'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { getCurrencyCode } from '../../util/CurrencyInfoHelpers'
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

export interface ExchangeParams {
  // The following props are used to populate the CryptoExchangeFlipInputs
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

interface Props extends EdgeSceneProps<'exchange'> {}

interface State {
  whichWalletFocus: 'from' | 'to' // Which wallet FlipInput2 was last focused and edited
  fromAmountNative: string
  toAmountNative: string
  paddingBottom: number
}

const defaultState: State = {
  whichWalletFocus: 'from',
  fromAmountNative: '',
  toAmountNative: '',
  paddingBottom: 0
}

const emptyDenomnination = {
  name: '',
  multiplier: '1'
}

export const CryptoExchangeScene = (props: Props) => {
  const { navigation, route } = props
  const { fromWalletId, fromTokenId = null, toWalletId, toTokenId = null, errorDisplayInfo } = route.params ?? {}
  const theme = useTheme()
  const styles = getStyles(theme)
  const dispatch = useDispatch()

  const [state, setState] = useState({
    ...defaultState
  })

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

  const toWalletDisplayDenomination = useSelector(state =>
    toWallet == null ? emptyDenomnination : selectDisplayDenom(state, toWallet.currencyConfig, toTokenId)
  )
  const fromWalletDisplayDenomination = useSelector(state =>
    fromWallet == null ? emptyDenomnination : selectDisplayDenom(state, fromWallet.currencyConfig, toTokenId)
  )
  const fromWalletSpecialCurrencyInfo = getSpecialCurrencyInfo(fromWallet?.currencyInfo.pluginId ?? '')
  const fromWalletBalanceMap = fromWallet?.balanceMap ?? new Map<string, string>()

  const isFromFocused = state.whichWalletFocus === 'from'
  const isToFocused = state.whichWalletFocus === 'to'
  const fromHeaderText = sprintf(lstrings.exchange_from_wallet, fromWalletName)
  const toHeaderText = sprintf(lstrings.exchange_to_wallet, toWalletName)
  // Determines if a coin can have Exchange Max option
  const hasMaxSpend = fromWalletSpecialCurrencyInfo.noMaxSpend !== true

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

  const checkExceedsAmount = (): boolean => {
    const { fromAmountNative, whichWalletFocus } = state
    const fromNativeBalance = fromWalletBalanceMap.get(fromTokenId) ?? '0'

    return whichWalletFocus === 'from' && gte(fromNativeBalance, '0') && gt(fromAmountNative, fromNativeBalance)
  }

  const getQuote = (swapRequest: EdgeSwapRequest) => {
    if (fromWallet == null || toWallet == null) {
      // Should never happen because next UI is hidden unless both source/destination wallets are selected
      throw new Error('No wallet selected')
    }

    if (exchangeInfo != null) {
      const disableSrc = checkDisableAsset(exchangeInfo.swap.disableAssets.source, fromWallet.id, fromTokenId)
      if (disableSrc) {
        showError(sprintf(lstrings.exchange_asset_unsupported, fromCurrencyCode))
        return
      }

      const disableDest = checkDisableAsset(exchangeInfo.swap.disableAssets.destination, toWallet.id, toTokenId)
      if (disableDest) {
        showError(sprintf(lstrings.exchange_asset_unsupported, toCurrencyCode))
        return
      }
    }
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
          onApprove: resetState
        })
      }
    })
    Keyboard.dismiss()
  }

  const resetState = () => {
    setState(defaultState)
  }

  const showWalletListModal = (whichWallet: 'from' | 'to') => {
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
          await handleSelectWallet(walletId, tokenId, whichWallet)
        }
      })
      .catch(error => showError(error))
  }

  //
  // Handlers
  //

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

  const handleMax = useHandler(() => {
    if (toWallet == null) {
      showWarning(`${lstrings.loan_select_receiving_wallet}`)
      Keyboard.dismiss()
      return
    }

    if (fromWallet == null) {
      // Should never happen because max button UI is hidden unless a source wallet is selected
      throw new Error('No wallet selected')
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
    if (fromWallet == null || toWallet == null) {
      // Should never happen because next UI is hidden unless both source/destination wallets are selected
      throw new Error('No wallet selected')
    }

    const request: EdgeSwapRequest = {
      fromTokenId: fromTokenId,
      fromWallet: fromWallet,
      nativeAmount: state.whichWalletFocus === 'from' ? state.fromAmountNative : state.toAmountNative,
      quoteFor: state.whichWalletFocus,
      toTokenId: toTokenId,
      toWallet: toWallet
    }

    if (zeroString(request.nativeAmount)) {
      showError(`${lstrings.no_exchange_amount}. ${lstrings.select_exchange_amount}.`)
      return
    }

    if (checkExceedsAmount()) return

    getQuote(request)
  })

  const handleFromSelectWallet = useHandler(() => {
    showWalletListModal('from')
  })

  const handleToSelectWallet = useHandler(() => {
    showWalletListModal('to')
  })

  const handleFromFocusWallet = useHandler(() => {
    setState({
      ...state,
      whichWalletFocus: 'from'
    })
  })

  const handleToFocusWallet = useHandler(() => {
    setState({
      ...state,
      whichWalletFocus: 'to'
    })
  })

  const handleFromAmountChange = useHandler((amounts: ExchangedFlipInputAmounts) => {
    setState({
      ...state,
      fromAmountNative: amounts.nativeAmount
    })
  })

  const handleToAmountChange = useHandler((amounts: ExchangedFlipInputAmounts) => {
    setState({
      ...state,
      toAmountNative: amounts.nativeAmount
    })
  })

  //
  // Render
  //

  const renderButton = () => {
    const primaryNativeAmount = state.whichWalletFocus === 'from' ? state.fromAmountNative : state.toAmountNative
    const showNext = fromCurrencyCode !== '' && toCurrencyCode !== '' && !!parseFloat(primaryNativeAmount)
    if (!showNext) return null
    if (checkExceedsAmount()) return null
    return <ButtonsViewUi4 primary={{ label: lstrings.string_next_capitalized, onPress: handleNext }} parentType="scene" />
  }

  const renderAlert = () => {
    const { minimumPopupModals } = fromWalletSpecialCurrencyInfo
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

  return (
    <SceneWrapper hasTabs hasNotifications scroll keyboardShouldPersistTaps="handled" padding={theme.rem(0.5)}>
      <EdgeAnim style={styles.header} enter={fadeInUp90}>
        <SceneHeader title={lstrings.title_exchange} underline />
      </EdgeAnim>
      <EdgeAnim enter={fadeInUp60}>
        <CryptoExchangeFlipInput
          wallet={fromWallet}
          buttonText={lstrings.select_src_wallet}
          headerText={fromHeaderText}
          currencyCode={fromCurrencyCode}
          displayDenomination={fromWalletDisplayDenomination}
          overridePrimaryNativeAmount={state.fromAmountNative}
          onSelectWallet={handleFromSelectWallet}
          onAmountChanged={handleFromAmountChange}
          isFocused={isFromFocused}
          onFocuseWallet={handleFromFocusWallet}
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
          wallet={toWallet}
          buttonText={lstrings.select_recv_wallet}
          headerText={toHeaderText}
          currencyCode={toCurrencyCode}
          displayDenomination={toWalletDisplayDenomination}
          overridePrimaryNativeAmount={state.toAmountNative}
          onSelectWallet={handleToSelectWallet}
          onAmountChanged={handleToAmountChange}
          isFocused={isToFocused}
          onFocuseWallet={handleToFocusWallet}
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
