// @flow

import Clipboard from '@react-native-clipboard/clipboard'
import { gt, lt, lte } from 'biggystring'
import type { EdgeCurrencyWallet, EdgeEncodeUri } from 'edge-core-js'
import * as React from 'react'
import type { RefObject } from 'react-native'
import { ActivityIndicator, InputAccessoryView, Linking, Platform, Text, TouchableOpacity, View } from 'react-native'
import Share from 'react-native-share'
import IonIcon from 'react-native-vector-icons/Ionicons'
import { sprintf } from 'sprintf-js'

import { refreshAllFioAddresses } from '../../actions/FioAddressActions.js'
import { selectWalletFromModal } from '../../actions/WalletActions'
import { getSpecialCurrencyInfo, SPECIAL_CURRENCY_INFO } from '../../constants/WalletAndCurrencyConstants.js'
import s from '../../locales/strings.js'
import { getDisplayDenomination, getExchangeDenomination } from '../../selectors/DenominationSelectors.js'
import { getExchangeRate } from '../../selectors/WalletSelectors.js'
import { config } from '../../theme/appConfig.js'
import { type TestProps, connect } from '../../types/reactRedux.js'
import { type NavigationProp } from '../../types/routerTypes.js'
import type { GuiCurrencyInfo, GuiDenomination } from '../../types/types.js'
import { getTokenId } from '../../util/CurrencyInfoHelpers.js'
import { getAvailableBalance, getWalletName } from '../../util/CurrencyWalletHelpers.js'
import { convertNativeToDenomination, getDenomFromIsoCode, getObjectDiff, truncateDecimals } from '../../util/utils.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { ButtonsModal } from '../modals/ButtonsModal.js'
import { QrModal } from '../modals/QrModal.js'
import { type WalletListResult, WalletListModal } from '../modals/WalletListModal.js'
import { Airship, showError, showToast } from '../services/AirshipInstance.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { FiatText } from '../text/FiatText.js'
import { Card } from '../themed/Card.js'
import { EdgeText } from '../themed/EdgeText.js'
import { type ExchangedFlipInputAmounts, ExchangedFlipInput } from '../themed/ExchangedFlipInput.js'
import { FlipInput } from '../themed/FlipInput.js'
import { QrCode } from '../themed/QrCode'
import { ShareButtons } from '../themed/ShareButtons.js'

type OwnProps = {
  navigation: NavigationProp<'request'>
}
type StateProps = {
  currencyCode?: string,
  wallet?: EdgeCurrencyWallet,
  exchangeSecondaryToPrimaryRatio?: string,
  fioAddressesExist?: boolean,
  isConnected: boolean,
  primaryCurrencyInfo?: GuiCurrencyInfo,
  secondaryCurrencyInfo?: GuiCurrencyInfo,
  useLegacyAddress?: boolean
}

type DispatchProps = {
  refreshAllFioAddresses: () => void,
  onSelectWallet: (walletId: string, currencyCode: string) => void
}
type ModalState = 'NOT_YET_SHOWN' | 'VISIBLE' | 'SHOWN'
type CurrencyMinimumPopupState = { [pluginId: string]: ModalState }

type Props = StateProps & DispatchProps & OwnProps & ThemeProps & TestProps

type State = {
  publicAddress: string,
  legacyAddress: string,
  encodedURI: string | void,
  minimumPopupModalState: CurrencyMinimumPopupState,
  isFioMode: boolean,
  errorMessage?: string
}

const inputAccessoryViewID: string = 'cancelHeaderId'

export class RequestComponent extends React.Component<Props, State> {
  amounts: ExchangedFlipInputAmounts
  flipInput: React.ElementRef<typeof FlipInput> | null = null
  unsubscribeAddressChanged: Function | null

  constructor(props: Props) {
    super(props)
    const minimumPopupModalState: CurrencyMinimumPopupState = {}
    Object.keys(SPECIAL_CURRENCY_INFO).forEach(pluginId => {
      if (getSpecialCurrencyInfo(pluginId).minimumPopupModals) {
        minimumPopupModalState[pluginId] = 'NOT_YET_SHOWN'
      }
    })
    this.state = {
      publicAddress: '',
      legacyAddress: '',
      encodedURI: undefined,
      minimumPopupModalState,
      isFioMode: false
    }
    if (this.shouldShowMinimumModal(props)) {
      const { wallet } = props
      if (wallet == null) return
      this.state.minimumPopupModalState[wallet.currencyInfo.pluginId] = 'VISIBLE'
      console.log('stop, in constructor')
      this.enqueueMinimumAmountModal()
    }
  }

  componentDidMount() {
    this.generateEncodedUri()
    this.props.refreshAllFioAddresses()
    if (this.props.wallet != null) {
      this.unsubscribeAddressChanged = this.props.wallet.on('addressChanged', () => this.generateEncodedUri())
    }
  }

  componentWillUnmount() {
    if (this.unsubscribeAddressChanged != null) this.unsubscribeAddressChanged()
  }

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    let diffElement2: string = ''
    const diffElement = getObjectDiff(this.props, nextProps, {
      primaryCurrencyInfo: true,
      secondaryCurrencyInfo: true,
      displayDenomination: true,
      exchangeDenomination: true
    })
    if (!diffElement) {
      diffElement2 = getObjectDiff(this.state, nextState)
    }
    return !!diffElement || !!diffElement2
  }

  async generateEncodedUri() {
    const { wallet, useLegacyAddress, currencyCode } = this.props
    let legacyAddress = ''
    let publicAddress = ''
    if (wallet != null) {
      const receiveAddress = await wallet.getReceiveAddress()
      legacyAddress = receiveAddress.legacyAddress
      publicAddress = receiveAddress.publicAddress
    }
    this.setState({
      publicAddress,
      legacyAddress
    })
    if (!currencyCode) return
    const abcEncodeUri = {
      publicAddress: useLegacyAddress && legacyAddress != null ? legacyAddress : publicAddress,
      currencyCode
    }
    let encodedURI
    try {
      encodedURI = wallet ? await wallet.encodeUri(abcEncodeUri) : undefined
      this.setState({
        encodedURI
      })
    } catch (e) {
      console.log(e)
      publicAddress = s.strings.loading
      legacyAddress = s.strings.loading
      this.setState({
        publicAddress,
        legacyAddress
      })
    }
  }

  async componentDidUpdate(prevProps: Props) {
    const { currencyCode, wallet, useLegacyAddress } = this.props
    if (wallet == null || currencyCode == null) return
    const { pluginId } = wallet.currencyInfo
    const receiveAddress = await wallet.getReceiveAddress()

    const didAddressChange = this.state.publicAddress !== receiveAddress.publicAddress
    const changeLegacyPublic = useLegacyAddress !== prevProps.useLegacyAddress
    const didWalletChange = prevProps.wallet && wallet.id !== prevProps.wallet.id

    if (didAddressChange || changeLegacyPublic || didWalletChange) {
      let { publicAddress, legacyAddress } = receiveAddress

      const abcEncodeUri = useLegacyAddress ? { publicAddress, legacyAddress, currencyCode } : { publicAddress, currencyCode }
      let encodedURI
      try {
        encodedURI = await wallet.encodeUri(abcEncodeUri)
      } catch (err) {
        console.log(err)
        publicAddress = s.strings.loading
        legacyAddress = s.strings.loading
      }

      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({
        encodedURI,
        publicAddress: publicAddress,
        legacyAddress: legacyAddress
      })
    }
    // old blank address to new
    // include 'didAddressChange' because didWalletChange returns false upon initial request scene load
    if (didWalletChange || didAddressChange) {
      if (this.shouldShowMinimumModal(this.props)) {
        const minimumPopupModalState: CurrencyMinimumPopupState = Object.assign({}, this.state.minimumPopupModalState)
        if (minimumPopupModalState[pluginId] === 'NOT_YET_SHOWN') {
          this.enqueueMinimumAmountModal()
        }
        minimumPopupModalState[pluginId] = 'VISIBLE'
        // eslint-disable-next-line react/no-did-update-set-state
        this.setState({ minimumPopupModalState })
      }
    }
  }

  enqueueMinimumAmountModal = async () => {
    const { wallet } = this.props
    if (wallet == null) return
    const { pluginId } = wallet.currencyInfo
    const { minimumPopupModals } = getSpecialCurrencyInfo(pluginId)
    if (minimumPopupModals == null) return

    await Airship.show(bridge => (
      <ButtonsModal
        bridge={bridge}
        title={s.strings.request_minimum_notification_title}
        message={minimumPopupModals.modalMessage}
        buttons={{ ok: { label: s.strings.string_ok } }}
      />
    ))

    // resolve value doesn't really matter here
    this.setState(state => ({
      minimumPopupModalState: {
        ...state.minimumPopupModalState,
        [pluginId]: 'SHOWN'
      }
    }))
  }

  onNext = () => {
    if (this.state.isFioMode) {
      this.setState({ isFioMode: false })
      this.fioAddressModal()
    }
  }

  flipInputRef = (ref: RefObject) => {
    if (ref?.flipInput) {
      this.flipInput = ref.flipInput
    }
  }

  handleAddressBlockExplorer = () => {
    const { wallet, useLegacyAddress } = this.props
    const addressExplorer = wallet != null ? wallet.currencyInfo.addressExplorer : null
    const requestAddress = useLegacyAddress ? this.state.legacyAddress : this.state.publicAddress

    Airship.show(bridge => (
      <ButtonsModal
        bridge={bridge}
        title={s.strings.modal_addressexplorer_message}
        message={requestAddress}
        buttons={{
          confirm: { label: s.strings.string_ok_cap },
          cancel: { label: s.strings.string_cancel_cap }
        }}
      />
    ))
      .then((result?: string) => {
        return result === 'confirm' ? Linking.openURL(sprintf(addressExplorer, requestAddress)) : null
      })
      .catch(error => console.log(error))
  }

  handleOpenWalletListModal = () => {
    Airship.show(bridge => <WalletListModal bridge={bridge} headerTitle={s.strings.select_wallet} />).then(({ walletId, currencyCode }: WalletListResult) => {
      if (walletId && currencyCode) {
        this.props.onSelectWallet(walletId, currencyCode)
      }
    })
  }

  handleQrCodePress = () => {
    Airship.show(bridge => <QrModal bridge={bridge} data={this.state.encodedURI} />)
  }

  onError = (errorMessage?: string) => this.setState({ errorMessage })

  render() {
    const { exchangeSecondaryToPrimaryRatio, wallet, primaryCurrencyInfo, secondaryCurrencyInfo, theme } = this.props
    const styles = getStyles(theme)

    if (primaryCurrencyInfo == null || secondaryCurrencyInfo == null || exchangeSecondaryToPrimaryRatio == null || wallet == null) {
      return <ActivityIndicator color={theme.primaryText} style={styles.loader} size="large" />
    }

    const requestAddress = this.props.useLegacyAddress ? this.state.legacyAddress : this.state.publicAddress
    const flipInputHeaderText = sprintf(s.strings.send_to_wallet, getWalletName(wallet))
    const { keysOnlyMode = false } = getSpecialCurrencyInfo(wallet.currencyInfo.pluginId)

    // Balance
    const nativeBalance = getAvailableBalance(wallet, primaryCurrencyInfo.displayCurrencyCode)
    const displayBalanceAmount = convertNativeToDenomination(primaryCurrencyInfo.displayDenomination.multiplier)(nativeBalance)
    const displayBalanceString = sprintf(s.strings.request_balance, `${truncateDecimals(displayBalanceAmount)} ${primaryCurrencyInfo.displayDenomination.name}`)

    // Selected denomination
    const denomString = `1 ${primaryCurrencyInfo.displayDenomination.name}`

    return (
      <SceneWrapper background="header" hasTabs={false}>
        {keysOnlyMode !== true ? (
          <View style={styles.container}>
            <View style={styles.requestContainer}>
              <EdgeText style={styles.title}>{s.strings.fragment_request_subtitle}</EdgeText>
              <EdgeText style={styles.exchangeRate}>{denomString}</EdgeText>
            </View>
            <View style={styles.balanceContainer}>
              <EdgeText>{displayBalanceString}</EdgeText>
              <EdgeText style={styles.exchangeRate}>
                <FiatText
                  appendFiatCurrencyCode
                  nativeCryptoAmount={primaryCurrencyInfo.displayDenomination.multiplier}
                  tokenId={primaryCurrencyInfo.tokenId}
                  wallet={wallet}
                />
              </EdgeText>
            </View>

            {this.state.errorMessage != null ? <EdgeText style={styles.errorText}>{this.state.errorMessage}</EdgeText> : null}

            <Card>
              <ExchangedFlipInput
                ref={this.flipInputRef}
                headerText={flipInputHeaderText}
                primaryCurrencyInfo={primaryCurrencyInfo}
                secondaryCurrencyInfo={secondaryCurrencyInfo}
                exchangeSecondaryToPrimaryRatio={exchangeSecondaryToPrimaryRatio}
                overridePrimaryExchangeAmount=""
                forceUpdateGuiCounter={0}
                onExchangeAmountChanged={this.onExchangeAmountChanged}
                keyboardVisible={false}
                isFiatOnTop
                isFocus={false}
                onNext={this.onNext}
                topReturnKeyType={this.state.isFioMode ? 'next' : 'done'}
                inputAccessoryViewID={this.state.isFioMode ? inputAccessoryViewID : ''}
                headerCallback={this.handleOpenWalletListModal}
                onError={this.onError}
              />
            </Card>

            {Platform.OS === 'ios' ? (
              <InputAccessoryView backgroundColor={theme.inputAccessoryBackground} nativeID={inputAccessoryViewID}>
                <View style={styles.accessoryView}>
                  <TouchableOpacity style={styles.accessoryButton} onPress={this.cancelFioMode}>
                    <Text style={styles.accessoryText}>{this.state.isFioMode ? s.strings.string_cancel_cap : ''}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.accessoryButton} onPress={this.nextFioMode}>
                    <Text style={styles.accessoryText}>{this.state.isFioMode ? s.strings.string_next_capitalized : 'Done'}</Text>
                  </TouchableOpacity>
                </View>
              </InputAccessoryView>
            ) : null}
            <QrCode data={this.state.encodedURI} onPress={this.handleQrCodePress} ref={this.props.generateTestHook('RequestScene.OpenQr')} />
            <TouchableOpacity onPress={this.handleAddressBlockExplorer}>
              <View style={styles.rightChevronContainer}>
                <EdgeText>{s.strings.request_qr_your_receiving_wallet_address}</EdgeText>
                <IonIcon name="chevron-forward" size={theme.rem(1.5)} color={theme.iconTappable} />
              </View>
              <EdgeText style={styles.publicAddressText}>{requestAddress}</EdgeText>
            </TouchableOpacity>
          </View>
        ) : (
          <EdgeText>{sprintf(s.strings.request_deprecated_currency_code, primaryCurrencyInfo.displayCurrencyCode)}</EdgeText>
        )}
        {keysOnlyMode !== true && (
          <ShareButtons shareViaShare={this.shareViaShare} copyToClipboard={this.copyToClipboard} fioAddressModal={this.fioAddressModal} />
        )}
      </SceneWrapper>
    )
  }

  onExchangeAmountChanged = async (amounts: ExchangedFlipInputAmounts) => {
    const { publicAddress, legacyAddress } = this.state
    const { currencyCode } = this.props
    this.amounts = amounts
    if (!currencyCode) return
    const edgeEncodeUri: EdgeEncodeUri =
      this.props.useLegacyAddress && legacyAddress ? { publicAddress, legacyAddress, currencyCode } : { publicAddress, currencyCode }
    if (gt(amounts.nativeAmount, '0')) {
      edgeEncodeUri.nativeAmount = amounts.nativeAmount
    }
    let encodedURI
    try {
      encodedURI = this.props.wallet ? await this.props.wallet.encodeUri(edgeEncodeUri) : undefined
    } catch (e) {
      console.log(e)
    }

    this.setState({ encodedURI })
  }

  copyToClipboard = () => {
    const requestAddress = this.props.useLegacyAddress ? this.state.legacyAddress : this.state.publicAddress
    Clipboard.setString(requestAddress)
    showToast(s.strings.fragment_request_address_copied)
  }

  shouldShowMinimumModal = (props: Props): boolean => {
    const { currencyCode, wallet } = props
    if (currencyCode == null || wallet == null) return false
    const { pluginId } = wallet.currencyInfo

    if (this.state.minimumPopupModalState[pluginId]) {
      if (this.state.minimumPopupModalState[pluginId] === 'NOT_YET_SHOWN') {
        const { minimumPopupModals } = getSpecialCurrencyInfo(pluginId)
        const minBalance = minimumPopupModals != null ? minimumPopupModals.minimumNativeBalance : '0'
        if (lt(wallet.balances[currencyCode] ?? '0', minBalance)) {
          return true
        }
      }
    }
    return false
  }

  shareMessage = async () => {
    const { currencyCode, wallet, useLegacyAddress } = this.props
    const { legacyAddress, publicAddress } = this.state
    if (!currencyCode || !wallet) {
      throw new Error('Wallet still loading. Please wait and try again.')
    }
    let sharedAddress = this.state.encodedURI ?? ''
    let edgePayUri = 'https://deep.edge.app/'
    let addOnMessage = ''
    // if encoded (like XTZ), only share the public address
    if (getSpecialCurrencyInfo(wallet.currencyInfo.pluginId).isUriEncodedStructure) {
      sharedAddress = publicAddress
    } else {
      // Rebuild uri to preserve uriPrefix if amount is 0
      if (sharedAddress != null && sharedAddress.indexOf('amount') === -1) {
        const edgeEncodeUri: EdgeEncodeUri =
          useLegacyAddress && legacyAddress
            ? { publicAddress, legacyAddress, currencyCode, nativeAmount: '0' }
            : { publicAddress, currencyCode, nativeAmount: '0' }
        const newUri = await wallet.encodeUri(edgeEncodeUri)
        sharedAddress = newUri.substring(0, newUri.indexOf('?'))
      }
      edgePayUri = edgePayUri + `pay/${sharedAddress.replace(':', '/')}`
      addOnMessage = `\n\n${sprintf(s.strings.request_qr_email_title, config.appName)}\n\n`
    }

    const subject = wallet != null ? sprintf(s.strings.request_email_subject, config.appName, wallet.currencyInfo.displayName) : ''
    const message = `${sharedAddress}${addOnMessage}`

    const shareOptions = {
      subject,
      message: Platform.OS === 'ios' ? message : message + edgePayUri,
      url: Platform.OS === 'ios' ? edgePayUri : ''
    }

    Share.open(shareOptions).catch(e => console.log(e))
  }

  shareViaShare = () => {
    this.shareMessage()
    // console.log('shareViaShare')
  }

  fioAddressModal = () => {
    const { navigation } = this.props
    if (!this.props.isConnected) {
      showError(s.strings.fio_network_alert_text)
      return
    }
    if (!this.props.fioAddressesExist) {
      showError(`${s.strings.title_register_fio_address}. ${s.strings.fio_request_by_fio_address_error_no_address}`)
      return
    }
    if (!this.amounts || lte(this.amounts.nativeAmount, '0')) {
      if (Platform.OS === 'android') {
        showError(`${s.strings.fio_request_by_fio_address_error_invalid_amount_header}. ${s.strings.fio_request_by_fio_address_error_invalid_amount}`)
        return
      } else {
        this.fioMode()
        return
      }
    }
    navigation.navigate('fioRequestConfirmation', {
      amounts: this.amounts
    })
  }

  fioMode = () => {
    if (this.flipInput && Platform.OS === 'ios') {
      this.flipInput.textInputBottomFocus()
      this.setState({ isFioMode: true })
    }
  }

  cancelFioMode = () => {
    this.setState({ isFioMode: false }, () => {
      if (this.flipInput) {
        this.flipInput.textInputBottomBlur()
      }
    })
  }

  nextFioMode = () => {
    if (this.state.isFioMode && (!this.amounts || lte(this.amounts.nativeAmount, '0'))) {
      showError(`${s.strings.fio_request_by_fio_address_error_invalid_amount_header}. ${s.strings.fio_request_by_fio_address_error_invalid_amount}`)
    } else {
      if (this.flipInput) {
        this.flipInput.textInputBottomBlur()
      }
      this.onNext()
    }
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: theme.rem(1)
  },
  requestContainer: {
    justifyContent: 'space-between',
    flexDirection: 'row'
  },
  balanceContainer: {
    justifyContent: 'space-between',
    flexDirection: 'row',
    marginBottom: theme.rem(0.5)
  },
  exchangeRate: {
    textAlign: 'right',
    alignSelf: 'flex-end',
    fontFamily: theme.fontFaceBold
  },
  title: {
    fontFamily: theme.fontFaceMedium,
    fontSize: theme.rem(2)
  },

  rightChevronContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },

  accessoryView: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: theme.inputAccessoryBackground
  },
  accessoryButton: {
    paddingVertical: theme.rem(0.5),
    paddingHorizontal: theme.rem(1)
  },
  accessoryText: {
    color: theme.inputAccessoryText
  },
  publicAddressText: {
    fontSize: theme.rem(0.75)
  },
  loader: {
    flex: 1,
    alignSelf: 'center'
  },
  errorText: {
    marginBottom: theme.rem(0.75),
    color: theme.dangerText
  }
}))

export const Request = connect<StateProps, DispatchProps, OwnProps & TestProps>(
  state => {
    const { account } = state.core
    const { currencyWallets } = account
    const walletId = state.ui.wallets.selectedWalletId
    const currencyCode: string = state.ui.wallets.selectedCurrencyCode

    if (currencyCode == null) {
      return {
        account,
        publicAddress: '',
        legacyAddress: '',
        fioAddressesExist: false,
        isConnected: state.network.isConnected
      }
    }

    const wallet: EdgeCurrencyWallet = currencyWallets[walletId]
    const { pluginId } = wallet.currencyInfo
    const primaryDisplayDenomination: GuiDenomination = getDisplayDenomination(state, wallet.currencyInfo.pluginId, currencyCode)
    const primaryExchangeDenomination: GuiDenomination = getExchangeDenomination(state, wallet.currencyInfo.pluginId, currencyCode)
    const secondaryExchangeDenomination: GuiDenomination = getDenomFromIsoCode(wallet.fiatCurrencyCode.replace('iso:', ''))
    const secondaryDisplayDenomination: GuiDenomination = secondaryExchangeDenomination
    const primaryExchangeCurrencyCode: string = primaryExchangeDenomination.name
    const secondaryExchangeCurrencyCode: string = secondaryExchangeDenomination.name ? secondaryExchangeDenomination.name : ''
    const tokenId = getTokenId(state.core.account, pluginId, currencyCode)

    const primaryCurrencyInfo: GuiCurrencyInfo = {
      walletId: walletId,
      pluginId,
      tokenId,
      displayCurrencyCode: currencyCode,
      displayDenomination: primaryDisplayDenomination,
      exchangeCurrencyCode: primaryExchangeCurrencyCode,
      exchangeDenomination: primaryExchangeDenomination
    }
    const secondaryCurrencyInfo: GuiCurrencyInfo = {
      walletId: walletId,
      displayCurrencyCode: wallet.fiatCurrencyCode.replace('iso:', ''),
      displayDenomination: secondaryDisplayDenomination,
      exchangeCurrencyCode: secondaryExchangeCurrencyCode,
      exchangeDenomination: secondaryExchangeDenomination
    }
    const isoFiatCurrencyCode: string = wallet.fiatCurrencyCode
    const exchangeSecondaryToPrimaryRatio = getExchangeRate(state, currencyCode, isoFiatCurrencyCode)
    const fioAddressesExist = !!state.ui.scenes.fioAddress.fioAddresses.length

    return {
      currencyCode,
      wallet,
      exchangeSecondaryToPrimaryRatio,
      primaryCurrencyInfo,
      secondaryCurrencyInfo,
      useLegacyAddress: state.ui.scenes.requestType.useLegacyAddress,
      fioAddressesExist,
      isConnected: state.network.isConnected
    }
  },
  dispatch => ({
    refreshAllFioAddresses() {
      dispatch(refreshAllFioAddresses())
    },
    onSelectWallet(walletId: string, currencyCode: string) {
      dispatch(selectWalletFromModal(walletId, currencyCode))
    }
  })
)(withTheme(RequestComponent))
