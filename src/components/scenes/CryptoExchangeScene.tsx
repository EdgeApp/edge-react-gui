import { div, gt, gte } from 'biggystring'
import { EdgeAccount, EdgeCurrencyWallet, EdgeTokenId } from 'edge-core-js'
import * as React from 'react'
import { Keyboard } from 'react-native'
import { sprintf } from 'sprintf-js'

import { getQuoteForTransaction, selectWalletForExchange, SetNativeAmountInfo } from '../../actions/CryptoExchangeActions'
import { DisableAsset, ExchangeInfo } from '../../actions/ExchangeInfoActions'
import { updateMostRecentWalletsSelected } from '../../actions/WalletActions'
import { getSpecialCurrencyInfo } from '../../constants/WalletAndCurrencyConstants'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { EdgeSceneProps, NavigationBase } from '../../types/routerTypes'
import { emptyCurrencyInfo, GuiCurrencyInfo } from '../../types/types'
import { getTokenId, getWalletTokenId } from '../../util/CurrencyInfoHelpers'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import { DECIMAL_PRECISION, zeroString } from '../../util/utils'
import { EdgeAnim, fadeInDown30, fadeInDown60, fadeInDown90, fadeInUp60, fadeInUp90 } from '../common/EdgeAnim'
import { SceneWrapper } from '../common/SceneWrapper'
import { WalletListModal, WalletListResult } from '../modals/WalletListModal'
import { Airship, showError, showWarning } from '../services/AirshipInstance'
import { cacheStyles, Theme, ThemeProps, useTheme } from '../services/ThemeContext'
import { CryptoExchangeFlipInput } from '../themed/CryptoExchangeFlipInput'
import { ExchangedFlipInputAmounts } from '../themed/ExchangedFlipInput2'
import { LineTextDivider } from '../themed/LineTextDivider'
import { MiniButton } from '../themed/MiniButton'
import { SceneHeader } from '../themed/SceneHeader'
import { AlertCardUi4 } from '../ui4/AlertCardUi4'
import { ButtonsViewUi4 } from '../ui4/ButtonsViewUi4'

interface OwnProps extends EdgeSceneProps<'exchange'> {}

interface StateProps {
  account: EdgeAccount
  exchangeInfo: ExchangeInfo

  // The following props are used to populate the CryptoExchangeFlipInputs
  fromWalletInfo: FromWalletInfo
  toWalletInfo: ToWalletInfo

  // Errors
  insufficient: boolean
  genericError: string | null
}

interface FromWalletInfo {
  fromWallet?: EdgeCurrencyWallet
  fromPluginId: string
  fromTokenId: EdgeTokenId
  fromWalletId: string
  fromWalletBalanceMap: Map<EdgeTokenId, string>
  fromWalletName: string
  fromExchangeAmount: string
  fromWalletPrimaryInfo: GuiCurrencyInfo
  // Used to populate the confirmation modal
  fromCurrencyCode: string
}

interface ToWalletInfo {
  toWallet?: EdgeCurrencyWallet
  toWalletId: string
  toWalletName: string
  toExchangeAmount: string
  toWalletPrimaryInfo: GuiCurrencyInfo
  // Used to populate the confirmation modal
  toCurrencyCode: string
}

interface DispatchProps {
  onSelectWallet: (walletId: string, tokenId: EdgeTokenId, direction: 'from' | 'to') => Promise<void>
  getQuoteForTransaction: (navigation: NavigationBase, fromWalletNativeAmount: SetNativeAmountInfo, onApprove: () => void) => void
}

type Props = OwnProps & StateProps & DispatchProps & ThemeProps

interface State {
  whichWalletFocus: 'from' | 'to' // Which wallet FlipInput2 was last focused and edited
  fromExchangeAmount: string
  toExchangeAmount: string
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
  fromExchangeAmount: '',
  fromWalletId: ''
}

const defaultToWalletInfo: ToWalletInfo = {
  toCurrencyCode: '',
  toWalletName: '',
  toWalletPrimaryInfo: emptyCurrencyInfo,
  toExchangeAmount: '',
  toWalletId: ''
}

const defaultState: State = {
  whichWalletFocus: 'from',
  fromExchangeAmount: '',
  toExchangeAmount: '',
  fromAmountNative: '',
  toAmountNative: '',
  paddingBottom: 0
}

export class CryptoExchangeComponent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    const newState: State = defaultState
    this.state = newState
  }

  static getDerivedStateFromProps(props: Props, state: State) {
    if (state.whichWalletFocus === 'from') {
      return { toExchangeAmount: props.toWalletInfo.toExchangeAmount }
    } else {
      return { fromExchangeAmount: props.fromWalletInfo.fromExchangeAmount }
    }
  }

  checkDisableAsset = (disableAssets: DisableAsset[], walletId: string, guiCurrencyInfo: GuiCurrencyInfo): boolean => {
    const wallet = this.props.account.currencyWallets[walletId] ?? { currencyInfo: {} }
    const walletPluginId = wallet.currencyInfo.pluginId
    const walletTokenId = guiCurrencyInfo.tokenId ?? getTokenId(this.props.account, walletPluginId, guiCurrencyInfo.exchangeCurrencyCode)
    for (const disableAsset of disableAssets) {
      const { pluginId, tokenId } = disableAsset
      if (pluginId !== walletPluginId) continue
      if (tokenId === walletTokenId) return true
      if (tokenId === 'allCoins') return true
      if (tokenId === 'allTokens' && walletTokenId != null) return true
    }
    return false
  }

  handleMax = () => {
    const data: SetNativeAmountInfo = {
      whichWallet: 'max',
      primaryNativeAmount: '0'
    }

    if (this.props.toWalletInfo.toCurrencyCode === '') {
      showWarning(`${lstrings.loan_select_receiving_wallet}`)
      Keyboard.dismiss()
      return
    }

    this.getQuote(data)
  }

  handleNext = () => {
    const data: SetNativeAmountInfo = {
      whichWallet: this.state.whichWalletFocus,
      primaryNativeAmount: this.state.whichWalletFocus === 'from' ? this.state.fromAmountNative : this.state.toAmountNative
    }

    if (zeroString(data.primaryNativeAmount)) {
      showError(`${lstrings.no_exchange_amount}. ${lstrings.select_exchange_amount}.`)
      return
    }

    if (this.checkExceedsAmount()) return

    this.getQuote(data)
  }

  handleSceneWrapperLayout = () => {}

  getQuote = (data: SetNativeAmountInfo) => {
    const { exchangeInfo, navigation } = this.props
    if (exchangeInfo != null) {
      const disableSrc = this.checkDisableAsset(
        exchangeInfo.swap.disableAssets.source,
        this.props.fromWalletInfo.fromWalletId,
        this.props.fromWalletInfo.fromWalletPrimaryInfo
      )
      if (disableSrc) {
        showError(sprintf(lstrings.exchange_asset_unsupported, this.props.fromWalletInfo.fromWalletPrimaryInfo.exchangeCurrencyCode))
        return
      }

      const disableDest = this.checkDisableAsset(
        exchangeInfo.swap.disableAssets.destination,
        this.props.toWalletInfo.toWalletId,
        this.props.toWalletInfo.toWalletPrimaryInfo
      )
      if (disableDest) {
        showError(sprintf(lstrings.exchange_asset_unsupported, this.props.toWalletInfo.toWalletPrimaryInfo.exchangeCurrencyCode))
        return
      }
    }
    this.props.getQuoteForTransaction(navigation, data, this.resetState)
    Keyboard.dismiss()
  }

  resetState = () => {
    this.setState(defaultState)
  }

  checkExceedsAmount(): boolean {
    const { fromTokenId, fromWalletBalanceMap } = this.props.fromWalletInfo
    const { fromAmountNative, whichWalletFocus } = this.state
    const fromNativeBalance = fromWalletBalanceMap.get(fromTokenId) ?? '0'

    return whichWalletFocus === 'from' && gte(fromNativeBalance, '0') && gt(fromAmountNative, fromNativeBalance)
  }

  launchFromWalletSelector = () => {
    this.renderDropUp('from')
  }

  launchToWalletSelector = () => {
    this.renderDropUp('to')
  }

  focusFromWallet = () => {
    this.setState({
      whichWalletFocus: 'from'
    })
  }

  focusToWallet = () => {
    this.setState({
      whichWalletFocus: 'to'
    })
  }

  fromAmountChanged = (amounts: ExchangedFlipInputAmounts) => {
    this.setState({
      fromAmountNative: amounts.nativeAmount
    })
  }

  toAmountChanged = (amounts: ExchangedFlipInputAmounts) => {
    this.setState({
      toAmountNative: amounts.nativeAmount
    })
  }

  renderButton = () => {
    const primaryNativeAmount = this.state.whichWalletFocus === 'from' ? this.state.fromAmountNative : this.state.toAmountNative
    const showNext = this.props.fromWalletInfo.fromCurrencyCode !== '' && this.props.toWalletInfo.toCurrencyCode !== '' && !!parseFloat(primaryNativeAmount)
    if (!showNext) return null
    if (this.checkExceedsAmount()) return null
    return <ButtonsViewUi4 primary={{ label: lstrings.string_next_capitalized, onPress: this.handleNext }} parentType="scene" />
  }

  renderAlert = () => {
    const { insufficient, genericError } = this.props
    const { fromPluginId, fromWalletBalanceMap, fromTokenId } = this.props.fromWalletInfo

    const { minimumPopupModals } = getSpecialCurrencyInfo(fromPluginId)
    const primaryNativeBalance = fromWalletBalanceMap.get(fromTokenId) ?? '0'

    if (minimumPopupModals != null && primaryNativeBalance < minimumPopupModals.minimumNativeBalance) {
      return <AlertCardUi4 title={lstrings.request_minimum_notification_title} body={minimumPopupModals.alertMessage} type="warning" />
    }

    if (insufficient || genericError != null) {
      const title = genericError != null ? lstrings.exchange_generic_error_title : insufficient ? lstrings.exchange_insufficient_funds_title : ''
      const message = genericError != null ? genericError : insufficient ? lstrings.exchange_insufficient_funds_message : ''
      return <AlertCardUi4 title={title} body={message} type="error" />
    }

    if (this.checkExceedsAmount()) {
      return <AlertCardUi4 title={lstrings.exchange_insufficient_funds_title} body={lstrings.exchange_insufficient_funds_below_balance} type="error" />
    }

    return null
  }

  renderDropUp = (whichWallet: 'from' | 'to') => {
    Airship.show<WalletListResult>(bridge => (
      <WalletListModal
        bridge={bridge}
        navigation={this.props.navigation}
        headerTitle={whichWallet === 'to' ? lstrings.select_recv_wallet : lstrings.select_src_wallet}
        showCreateWallet={whichWallet === 'to'}
        allowKeysOnlyMode={whichWallet === 'from'}
        filterActivation
      />
    ))
      .then(async result => {
        if (result?.type === 'wallet') {
          const { walletId, tokenId } = result
          await this.props.onSelectWallet(walletId, tokenId, whichWallet)
        }
      })
      .catch(error => showError(error))
  }

  render() {
    const { theme } = this.props
    const { fromWalletName } = this.props.fromWalletInfo
    const { toWalletName } = this.props.toWalletInfo

    const styles = getStyles(theme)

    const isFromFocused = this.state.whichWalletFocus === 'from'
    const isToFocused = this.state.whichWalletFocus === 'to'
    const fromHeaderText = sprintf(lstrings.exchange_from_wallet, fromWalletName)
    const toHeaderText = sprintf(lstrings.exchange_to_wallet, toWalletName)
    // Determines if a coin can have Exchange Max option
    const hasMaxSpend = getSpecialCurrencyInfo(this.props.fromWalletInfo.fromPluginId).noMaxSpend !== true

    return (
      <>
        <EdgeAnim style={styles.header} enter={fadeInUp90}>
          <SceneHeader title={lstrings.title_exchange} underline />
        </EdgeAnim>
        <EdgeAnim enter={fadeInUp60}>
          <CryptoExchangeFlipInput
            wallet={this.props.fromWalletInfo.fromWallet}
            buttonText={lstrings.select_src_wallet}
            headerText={fromHeaderText}
            primaryCurrencyInfo={this.props.fromWalletInfo.fromWalletPrimaryInfo}
            overridePrimaryNativeAmount={this.state.fromAmountNative}
            launchWalletSelector={this.launchFromWalletSelector}
            onCryptoExchangeAmountChanged={this.fromAmountChanged}
            isFocused={isFromFocused}
            focusMe={this.focusFromWallet}
            onNext={this.handleNext}
          >
            {hasMaxSpend ? <MiniButton label={lstrings.string_max_cap} marginRem={[0.5, 0, 0.75]} onPress={this.handleMax} alignSelf="center" /> : null}
          </CryptoExchangeFlipInput>
        </EdgeAnim>
        <EdgeAnim>
          <LineTextDivider title={lstrings.string_to_capitalize} lowerCased />
        </EdgeAnim>
        <EdgeAnim enter={fadeInDown30}>
          <CryptoExchangeFlipInput
            wallet={this.props.toWalletInfo.toWallet}
            buttonText={lstrings.select_recv_wallet}
            headerText={toHeaderText}
            primaryCurrencyInfo={this.props.toWalletInfo.toWalletPrimaryInfo}
            overridePrimaryNativeAmount={this.state.toAmountNative}
            launchWalletSelector={this.launchToWalletSelector}
            onCryptoExchangeAmountChanged={this.toAmountChanged}
            isFocused={isToFocused}
            focusMe={this.focusToWallet}
            onNext={this.handleNext}
          />
        </EdgeAnim>
        <EdgeAnim enter={fadeInDown60}>{this.renderAlert()}</EdgeAnim>
        <EdgeAnim enter={fadeInDown90}>{this.renderButton()}</EdgeAnim>
      </>
    )
  }
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
  const theme = useTheme()

  const account = useSelector(state => state.core.account)
  const currencyWallets = useSelector(state => state.core.account.currencyWallets)
  const cryptoExchange = useSelector(state => state.cryptoExchange)
  const exchangeInfo = useSelector(state => state.ui.exchangeInfo)
  const insufficient = useSelector(state => state.cryptoExchange.insufficientError)
  const genericError = useSelector(state => state.cryptoExchange.genericShapeShiftError)

  const { fromWalletId, toWalletId } = cryptoExchange

  let fromWalletInfo = defaultFromWalletInfo
  let toWalletInfo = defaultToWalletInfo

  if (fromWalletId != null && currencyWallets[fromWalletId] != null) {
    const fromWallet = currencyWallets[fromWalletId]
    const { fromNativeAmount, fromWalletPrimaryInfo } = cryptoExchange
    const {
      exchangeDenomination: { multiplier },
      exchangeCurrencyCode
    } = fromWalletPrimaryInfo
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
      fromExchangeAmount: div(fromNativeAmount, multiplier, DECIMAL_PRECISION),
      fromPluginId: fromWallet.currencyInfo.pluginId
    }
  }

  // Get the values of the 'To' Wallet
  if (toWalletId != null && currencyWallets[toWalletId] != null) {
    const toWallet = currencyWallets[toWalletId]
    const { toNativeAmount, toWalletPrimaryInfo } = cryptoExchange
    const {
      exchangeDenomination: { multiplier },
      exchangeCurrencyCode
    } = toWalletPrimaryInfo
    const toWalletName = getWalletName(toWallet)

    toWalletInfo = {
      toWallet,
      toWalletId,
      toWalletName,
      toCurrencyCode: exchangeCurrencyCode,
      toWalletPrimaryInfo,
      toExchangeAmount: div(toNativeAmount, multiplier, DECIMAL_PRECISION)
    }
  }

  const handleSelectWallet = useHandler(async (walletId: string, tokenId: EdgeTokenId, direction: 'from' | 'to') => {
    await dispatch(selectWalletForExchange(walletId, tokenId, direction))
    dispatch(updateMostRecentWalletsSelected(walletId, tokenId))
  })

  const handleGetQuoteForTransaction = useHandler((navigation: NavigationBase, fromWalletNativeAmount: SetNativeAmountInfo, onApprove: () => void) => {
    dispatch(getQuoteForTransaction(navigation, fromWalletNativeAmount, onApprove)).catch(err => showError(err))
  })

  return (
    <SceneWrapper hasTabs hasNotifications scroll keyboardShouldPersistTaps="handled" padding={theme.rem(0.5)}>
      <CryptoExchangeComponent
        route={route}
        onSelectWallet={handleSelectWallet}
        getQuoteForTransaction={handleGetQuoteForTransaction}
        theme={theme}
        navigation={navigation}
        account={account}
        exchangeInfo={exchangeInfo}
        insufficient={insufficient}
        genericError={genericError}
        fromWalletInfo={fromWalletInfo}
        toWalletInfo={toWalletInfo}
      />
    </SceneWrapper>
  )
}
