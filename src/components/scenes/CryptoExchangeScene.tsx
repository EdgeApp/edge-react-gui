import { div, gt, gte } from 'biggystring'
import { EdgeAccount, EdgeTokenId } from 'edge-core-js'
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
import { CryptoExchangeFlipInputWrapper } from '../themed/CryptoExchangeFlipInputWrapperComponent'
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
  fromTokenId: EdgeTokenId
  fromWalletId: string
  fromWalletBalanceMap: Map<EdgeTokenId, string>
  fromWalletName: string
  fromExchangeAmount: string
  fromWalletPrimaryInfo: GuiCurrencyInfo
  toWalletId: string
  toWalletName: string
  toExchangeAmount: string
  toWalletPrimaryInfo: GuiCurrencyInfo
  pluginId: string

  // The following props are used to populate the confirmation modal
  fromCurrencyCode: string
  toCurrencyCode: string

  // Determines if a coin can have Exchange Max option
  hasMaxSpend: boolean

  // Errors
  insufficient: boolean
  genericError: string | null
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

const defaultFromWalletInfo = {
  fromTokenId: null,
  fromCurrencyCode: '',
  fromWalletBalanceMap: new Map<EdgeTokenId, string>(),
  fromWalletName: '',
  fromWalletPrimaryInfo: emptyCurrencyInfo,
  fromExchangeAmount: '',
  fromWalletId: '',
  pluginId: '',
  hasMaxSpend: false
}

const defaultToWalletInfo = {
  toCurrencyCode: '',
  toWalletName: '',
  toWalletPrimaryInfo: emptyCurrencyInfo,
  toExchangeAmount: '',
  toWalletId: ''
}

const defaultState = {
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
    // @ts-expect-error
    const newState: State = defaultState
    this.state = newState
  }

  static getDerivedStateFromProps(props: Props, state: State) {
    if (state.whichWalletFocus === 'from') {
      return { toExchangeAmount: props.toExchangeAmount }
    } else {
      return { fromExchangeAmount: props.fromExchangeAmount }
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

    if (this.props.toCurrencyCode === '') {
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
      const disableSrc = this.checkDisableAsset(exchangeInfo.swap.disableAssets.source, this.props.fromWalletId, this.props.fromWalletPrimaryInfo)
      if (disableSrc) {
        showError(sprintf(lstrings.exchange_asset_unsupported, this.props.fromWalletPrimaryInfo.exchangeCurrencyCode))
        return
      }

      const disableDest = this.checkDisableAsset(exchangeInfo.swap.disableAssets.destination, this.props.toWalletId, this.props.toWalletPrimaryInfo)
      if (disableDest) {
        showError(sprintf(lstrings.exchange_asset_unsupported, this.props.toWalletPrimaryInfo.exchangeCurrencyCode))
        return
      }
    }
    this.props.getQuoteForTransaction(navigation, data, this.resetState)
    Keyboard.dismiss()
  }

  resetState = () => {
    // @ts-expect-error
    this.setState(defaultState)
  }

  checkExceedsAmount(): boolean {
    const { fromTokenId, fromWalletBalanceMap } = this.props
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
    const showNext = this.props.fromCurrencyCode !== '' && this.props.toCurrencyCode !== '' && !!parseFloat(primaryNativeAmount)
    if (!showNext) return null
    if (this.checkExceedsAmount()) return null
    return <ButtonsViewUi4 primary={{ label: lstrings.string_next_capitalized, onPress: this.handleNext }} parentType="scene" />
  }

  renderAlert = () => {
    const { fromWalletBalanceMap, fromTokenId, insufficient, genericError, pluginId } = this.props

    const { minimumPopupModals } = getSpecialCurrencyInfo(pluginId)
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
    const { fromWalletName, toWalletName, theme } = this.props

    const styles = getStyles(theme)

    const isFromFocused = this.state.whichWalletFocus === 'from'
    const isToFocused = this.state.whichWalletFocus === 'to'
    const fromHeaderText = sprintf(lstrings.exchange_from_wallet, fromWalletName)
    const toHeaderText = sprintf(lstrings.exchange_to_wallet, toWalletName)

    return (
      <>
        <EdgeAnim style={styles.header} enter={fadeInUp90}>
          <SceneHeader title={lstrings.title_exchange} underline />
        </EdgeAnim>
        <EdgeAnim enter={fadeInUp60}>
          <CryptoExchangeFlipInputWrapper
            walletId={this.props.fromWalletId}
            buttonText={lstrings.select_src_wallet}
            headerText={fromHeaderText}
            primaryCurrencyInfo={this.props.fromWalletPrimaryInfo}
            overridePrimaryNativeAmount={this.state.fromAmountNative}
            launchWalletSelector={this.launchFromWalletSelector}
            onCryptoExchangeAmountChanged={this.fromAmountChanged}
            isFocused={isFromFocused}
            focusMe={this.focusFromWallet}
            onNext={this.handleNext}
          >
            {this.props.hasMaxSpend ? (
              <MiniButton label={lstrings.string_max_cap} marginRem={[0.5, 0, 0.75]} onPress={this.handleMax} alignSelf="center" />
            ) : null}
          </CryptoExchangeFlipInputWrapper>
        </EdgeAnim>
        <EdgeAnim>
          <LineTextDivider title={lstrings.string_to_capitalize} lowerCased />
        </EdgeAnim>
        <EdgeAnim enter={fadeInDown30}>
          <CryptoExchangeFlipInputWrapper
            walletId={this.props.toWalletId}
            buttonText={lstrings.select_recv_wallet}
            headerText={toHeaderText}
            primaryCurrencyInfo={this.props.toWalletPrimaryInfo}
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

  const result = {
    ...defaultFromWalletInfo,
    ...defaultToWalletInfo
  }

  if (fromWalletId != null && currencyWallets[fromWalletId] != null) {
    const fromWallet = currencyWallets[fromWalletId]
    const { fromNativeAmount, fromWalletPrimaryInfo } = cryptoExchange
    const {
      exchangeDenomination: { multiplier },
      exchangeCurrencyCode
    } = fromWalletPrimaryInfo
    const fromTokenId = getWalletTokenId(fromWallet, exchangeCurrencyCode)

    const fromWalletName = getWalletName(currencyWallets[fromWalletId])
    const {
      currencyInfo: { pluginId },
      balanceMap: fromWalletBalanceMap
    } = currencyWallets[fromWalletId]

    Object.assign(result, {
      fromTokenId,
      fromWalletId,
      fromWalletName,
      fromWalletBalanceMap,
      fromCurrencyCode: exchangeCurrencyCode,
      fromWalletPrimaryInfo,
      fromExchangeAmount: div(fromNativeAmount, multiplier, DECIMAL_PRECISION),
      pluginId,
      hasMaxSpend: getSpecialCurrencyInfo(pluginId).noMaxSpend !== true
    })
  }

  // Get the values of the 'To' Wallet
  if (toWalletId != null && currencyWallets[toWalletId] != null) {
    const { toNativeAmount, toWalletPrimaryInfo } = cryptoExchange
    const {
      exchangeDenomination: { multiplier },
      exchangeCurrencyCode
    } = toWalletPrimaryInfo
    const toWalletName = getWalletName(currencyWallets[toWalletId])

    Object.assign(result, {
      toWalletId,
      toWalletName,
      toCurrencyCode: exchangeCurrencyCode,
      toWalletPrimaryInfo,
      toExchangeAmount: div(toNativeAmount, multiplier, DECIMAL_PRECISION)
    })
  }

  const handleSelectWallet = useHandler(async (walletId: string, tokenId: EdgeTokenId, direction: 'from' | 'to') => {
    await dispatch(selectWalletForExchange(walletId, tokenId, direction))
    dispatch(updateMostRecentWalletsSelected(walletId, tokenId))
  })

  const handleGetQuoteForTransaction = useHandler((navigation: NavigationBase, fromWalletNativeAmount: SetNativeAmountInfo, onApprove: () => void) => {
    dispatch(getQuoteForTransaction(navigation, fromWalletNativeAmount, onApprove)).catch(err => showError(err))
  })

  return (
    <SceneWrapper hasTabs hasNotifications scroll padding={theme.rem(0.5)}>
      <CryptoExchangeComponent
        route={route}
        onSelectWallet={handleSelectWallet}
        getQuoteForTransaction={handleGetQuoteForTransaction}
        theme={theme}
        navigation={navigation}
        account={account}
        {...result}
        exchangeInfo={exchangeInfo}
        insufficient={insufficient}
        genericError={genericError}
      />
    </SceneWrapper>
  )
}
