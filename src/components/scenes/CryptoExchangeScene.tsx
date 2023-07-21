import { div, gt, gte } from 'biggystring'
import { EdgeAccount } from 'edge-core-js'
import * as React from 'react'
import { Keyboard } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { sprintf } from 'sprintf-js'

import { getQuoteForTransaction, selectWalletForExchange, SetNativeAmountInfo } from '../../actions/CryptoExchangeActions'
import { DisableAsset, ExchangeInfo } from '../../actions/ExchangeInfoActions'
import { updateMostRecentWalletsSelected } from '../../actions/WalletActions'
import { getSpecialCurrencyInfo } from '../../constants/WalletAndCurrencyConstants'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { convertCurrencyFromExchangeRates } from '../../selectors/WalletSelectors'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { EdgeSceneProps, NavigationBase } from '../../types/routerTypes'
import { emptyCurrencyInfo, GuiCurrencyInfo } from '../../types/types'
import { getTokenId } from '../../util/CurrencyInfoHelpers'
import { getWalletFiat, getWalletName } from '../../util/CurrencyWalletHelpers'
import { DECIMAL_PRECISION, getDenomFromIsoCode, zeroString } from '../../util/utils'
import { NotificationSceneWrapper } from '../common/SceneWrapper'
import { WalletListModal, WalletListResult } from '../modals/WalletListModal'
import { Airship, showError, showWarning } from '../services/AirshipInstance'
import { cacheStyles, Theme, ThemeProps, useTheme } from '../services/ThemeContext'
import { Alert } from '../themed/Alert'
import { CryptoExchangeFlipInputWrapper } from '../themed/CryptoExchangeFlipInputWrapperComponent'
import { ExchangedFlipInputAmounts } from '../themed/ExchangedFlipInput'
import { LineTextDivider } from '../themed/LineTextDivider'
import { MainButton } from '../themed/MainButton'
import { MiniButton } from '../themed/MiniButton'
import { SceneHeader } from '../themed/SceneHeader'

interface OwnProps extends EdgeSceneProps<'exchange'> {}

interface StateProps {
  account: EdgeAccount
  exchangeInfo: ExchangeInfo

  // The following props are used to populate the CryptoExchangeFlipInputs
  fromWalletId: string
  fromWalletBalances: { [code: string]: string }
  fromFiatCurrencyCode: string
  fromIsoFiatCurrencyCode: string
  fromWalletName: string
  fromExchangeAmount: string
  fromWalletPrimaryInfo: GuiCurrencyInfo
  fromFiatToCrypto: string
  toWalletId: string
  toFiatCurrencyCode: string
  toIsoFiatCurrencyCode: string
  toWalletName: string
  toExchangeAmount: string
  toWalletPrimaryInfo: GuiCurrencyInfo
  toFiatToCrypto: string
  pluginId: string

  // The following props are used to populate the confirmation modal
  fromCurrencyCode: string
  toCurrencyCode: string

  // Determines if a coin can have Exchange Max option
  hasMaxSpend: boolean

  // Errors
  insufficient: boolean
  genericError: string | null

  overscroll: number
}
interface DispatchProps {
  onSelectWallet: (walletId: string, currencyCode: string, direction: 'from' | 'to') => Promise<void>
  getQuoteForTransaction: (navigation: NavigationBase, fromWalletNativeAmount: SetNativeAmountInfo, onApprove: () => void) => void
}

type Props = OwnProps & StateProps & DispatchProps & ThemeProps

interface State {
  whichWalletFocus: 'from' | 'to' // Which wallet FlipInput was last focused and edited
  fromExchangeAmount: string
  toExchangeAmount: string
  fromAmountNative: string
  toAmountNative: string
  paddingBottom: number
}

const defaultFromWalletInfo = {
  fromCurrencyCode: '',
  fromWalletBalances: {},
  fromFiatCurrencyCode: '',
  fromIsoFiatCurrencyCode: '',
  fromWalletName: '',
  fromWalletPrimaryInfo: emptyCurrencyInfo,
  fromExchangeAmount: '',
  fromFiatToCrypto: '1',
  fromWalletId: '',
  pluginId: '',
  hasMaxSpend: false
}

const defaultToWalletInfo = {
  toCurrencyCode: '',
  toFiatCurrencyCode: '',
  toIsoFiatCurrencyCode: '',
  toWalletName: '',
  toWalletPrimaryInfo: emptyCurrencyInfo,
  toExchangeAmount: '',
  toWalletId: '',
  toFiatToCrypto: '1'
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
    const { fromCurrencyCode, fromWalletBalances } = this.props
    const { fromAmountNative, whichWalletFocus } = this.state
    const fromNativeBalance = fromWalletBalances[fromCurrencyCode] ?? '0'

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
    return <MainButton label={lstrings.string_next_capitalized} type="secondary" marginRem={[1.5, 0, 1.5]} paddingRem={[0.5, 2.3]} onPress={this.handleNext} />
  }

  renderAlert = () => {
    const { fromWalletBalances, fromCurrencyCode, insufficient, genericError, pluginId } = this.props

    const { minimumPopupModals } = getSpecialCurrencyInfo(pluginId)
    const primaryNativeBalance = fromWalletBalances[fromCurrencyCode] ?? '0'

    if (minimumPopupModals != null && primaryNativeBalance < minimumPopupModals.minimumNativeBalance) {
      return <Alert marginRem={[1.5, 1]} title={lstrings.request_minimum_notification_title} message={minimumPopupModals.alertMessage} type="warning" />
    }

    if (insufficient || genericError != null) {
      const title = genericError != null ? lstrings.exchange_generic_error_title : insufficient ? lstrings.exchange_insufficient_funds_title : ''
      const message = genericError != null ? genericError : insufficient ? lstrings.exchange_insufficient_funds_message : ''
      return <Alert marginRem={[1.5, 1]} title={title} message={message} type="error" />
    }

    if (this.checkExceedsAmount()) {
      return (
        <Alert
          marginRem={[1.5, 1]}
          title={lstrings.exchange_insufficient_funds_title}
          message={lstrings.exchange_insufficient_funds_below_balance}
          type="error"
        />
      )
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
        const { walletId, currencyCode } = result
        if (walletId != null && currencyCode != null) {
          await this.props.onSelectWallet(walletId, currencyCode, whichWallet)
        }
      })
      .catch(error => showError(error))
  }

  render() {
    const { fromFiatCurrencyCode, fromIsoFiatCurrencyCode, fromWalletName, toFiatCurrencyCode, toIsoFiatCurrencyCode, toWalletName, theme, overscroll } =
      this.props
    const styles = getStyles(theme)
    let fromSecondaryInfo: GuiCurrencyInfo
    if (fromFiatCurrencyCode !== '') {
      fromSecondaryInfo = {
        walletId: defaultFromWalletInfo.fromWalletId,
        displayCurrencyCode: fromFiatCurrencyCode,
        exchangeCurrencyCode: fromIsoFiatCurrencyCode,
        displayDenomination: getDenomFromIsoCode(fromFiatCurrencyCode),
        exchangeDenomination: getDenomFromIsoCode(fromFiatCurrencyCode)
      }
    } else {
      fromSecondaryInfo = emptyCurrencyInfo
    }

    let toSecondaryInfo: GuiCurrencyInfo
    if (toFiatCurrencyCode !== '') {
      toSecondaryInfo = {
        walletId: defaultToWalletInfo.toWalletId,
        displayCurrencyCode: toFiatCurrencyCode,
        exchangeCurrencyCode: toIsoFiatCurrencyCode,
        displayDenomination: getDenomFromIsoCode(toFiatCurrencyCode),
        exchangeDenomination: getDenomFromIsoCode(toFiatCurrencyCode)
      }
    } else {
      toSecondaryInfo = emptyCurrencyInfo
    }
    const isFromFocused = this.state.whichWalletFocus === 'from'
    const isToFocused = this.state.whichWalletFocus === 'to'
    const fromHeaderText = sprintf(lstrings.exchange_from_wallet, fromWalletName)
    const toHeaderText = sprintf(lstrings.exchange_to_wallet, toWalletName)

    return (
      <>
        <SceneHeader title={lstrings.title_exchange} underline />
        <KeyboardAwareScrollView
          style={styles.mainScrollView}
          keyboardShouldPersistTaps="always"
          contentContainerStyle={[{ paddingBottom: overscroll }, styles.scrollViewContentContainer]}
        >
          <LineTextDivider title={lstrings.fragment_send_from_label} lowerCased />
          <CryptoExchangeFlipInputWrapper
            walletId={this.props.fromWalletId}
            buttonText={lstrings.select_src_wallet}
            headerText={fromHeaderText}
            primaryCurrencyInfo={this.props.fromWalletPrimaryInfo}
            secondaryCurrencyInfo={fromSecondaryInfo}
            fiatPerCrypto={this.props.fromFiatToCrypto}
            overridePrimaryExchangeAmount={this.state.fromExchangeAmount}
            launchWalletSelector={this.launchFromWalletSelector}
            onCryptoExchangeAmountChanged={this.fromAmountChanged}
            isFocused={isFromFocused}
            focusMe={this.focusFromWallet}
            onNext={this.handleNext}
          >
            {this.props.hasMaxSpend ? <MiniButton alignSelf="center" label={lstrings.string_max_cap} marginRem={[1.2, 0, 0]} onPress={this.handleMax} /> : null}
          </CryptoExchangeFlipInputWrapper>
          <LineTextDivider title={lstrings.string_to_capitalize} lowerCased />
          <CryptoExchangeFlipInputWrapper
            walletId={this.props.toWalletId}
            buttonText={lstrings.select_recv_wallet}
            headerText={toHeaderText}
            primaryCurrencyInfo={this.props.toWalletPrimaryInfo}
            secondaryCurrencyInfo={toSecondaryInfo}
            fiatPerCrypto={this.props.toFiatToCrypto}
            overridePrimaryExchangeAmount={this.state.toExchangeAmount}
            launchWalletSelector={this.launchToWalletSelector}
            onCryptoExchangeAmountChanged={this.toAmountChanged}
            isFocused={isToFocused}
            focusMe={this.focusToWallet}
            onNext={this.handleNext}
          />
          {this.renderAlert()}
          {this.renderButton()}
        </KeyboardAwareScrollView>
      </>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  mainScrollView: {
    flex: 1,
    marginBottom: theme.rem(1)
  },
  scrollViewContentContainer: {
    alignItems: 'center',
    paddingTop: theme.rem(0.5)
  }
}))

export const CryptoExchangeScene = (props: OwnProps) => {
  const dispatch = useDispatch()
  const { navigation, route } = props
  const theme = useTheme()

  const account = useSelector(state => state.core.account)
  const exchangeRates = useSelector(state => state.exchangeRates)
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
    const { fromNativeAmount, fromWalletPrimaryInfo } = cryptoExchange
    const {
      exchangeDenomination: { multiplier },
      exchangeCurrencyCode
    } = fromWalletPrimaryInfo

    const fromWalletName = getWalletName(currencyWallets[fromWalletId])
    const { fiatCurrencyCode: fromFiatCurrencyCode, isoFiatCurrencyCode: fromIsoFiatCurrencyCode } = getWalletFiat(currencyWallets[fromWalletId])
    const {
      currencyInfo: { pluginId },
      balances: fromWalletBalances
    } = currencyWallets[fromWalletId]

    Object.assign(result, {
      fromWalletId,
      fromWalletName,
      fromWalletBalances,
      fromFiatCurrencyCode,
      fromIsoFiatCurrencyCode,
      fromCurrencyCode: exchangeCurrencyCode,
      fromWalletPrimaryInfo,
      fromExchangeAmount: div(fromNativeAmount, multiplier, DECIMAL_PRECISION),
      fromFiatToCrypto: convertCurrencyFromExchangeRates(exchangeRates, exchangeCurrencyCode, fromIsoFiatCurrencyCode, '1'),
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
    const { fiatCurrencyCode: toFiatCurrencyCode, isoFiatCurrencyCode: toIsoFiatCurrencyCode } = getWalletFiat(currencyWallets[toWalletId])

    Object.assign(result, {
      toWalletId,
      toWalletName,
      toCurrencyCode: exchangeCurrencyCode,
      toFiatCurrencyCode,
      toIsoFiatCurrencyCode,
      toWalletPrimaryInfo,
      toExchangeAmount: div(toNativeAmount, multiplier, DECIMAL_PRECISION),
      toFiatToCrypto: convertCurrencyFromExchangeRates(exchangeRates, exchangeCurrencyCode, toIsoFiatCurrencyCode, '1')
    })
  }

  const handleSelectWallet = useHandler(async (walletId: string, currencyCode: string, direction: 'from' | 'to') => {
    await dispatch(selectWalletForExchange(walletId, currencyCode, direction))
    dispatch(updateMostRecentWalletsSelected(walletId, currencyCode))
  })

  const handleGetQuoteForTransaction = useHandler((navigation: NavigationBase, fromWalletNativeAmount: SetNativeAmountInfo, onApprove: () => void) => {
    dispatch(getQuoteForTransaction(navigation, fromWalletNativeAmount, onApprove)).catch(err => showError(err))
  })

  return (
    <NotificationSceneWrapper navigation={navigation} hasTabs>
      {(gap, notificationHeight) => (
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
          overscroll={notificationHeight}
        />
      )}
    </NotificationSceneWrapper>
  )
}
