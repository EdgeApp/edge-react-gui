// @flow

import Clipboard from '@react-native-community/clipboard'
import { gt, lt, lte } from 'biggystring'
import type { EdgeCurrencyInfo, EdgeCurrencyWallet, EdgeEncodeUri } from 'edge-core-js'
import * as React from 'react'
import type { RefObject } from 'react-native'
import { ActivityIndicator, InputAccessoryView, Linking, Platform, Text, TouchableOpacity, View } from 'react-native'
import Share from 'react-native-share'
import IonIcon from 'react-native-vector-icons/Ionicons'
import { sprintf } from 'sprintf-js'

import { refreshAllFioAddresses } from '../../actions/FioAddressActions.js'
import { refreshReceiveAddressRequest, selectWalletFromModal } from '../../actions/WalletActions'
import { getSpecialCurrencyInfo, SPECIAL_CURRENCY_INFO } from '../../constants/WalletAndCurrencyConstants.js'
import s from '../../locales/strings.js'
import { getDisplayDenomination, getExchangeDenomination } from '../../selectors/DenominationSelectors.js'
import { getExchangeRate, getSelectedWallet } from '../../selectors/WalletSelectors.js'
import { connect } from '../../types/reactRedux.js'
import { type NavigationProp } from '../../types/routerTypes.js'
import type { GuiCurrencyInfo, GuiDenomination, GuiWallet } from '../../types/types.js'
import { getCurrencyIcon } from '../../util/CurrencyInfoHelpers.js'
import { getAvailableBalance, getWalletName } from '../../util/CurrencyWalletHelpers.js'
import { convertNativeToDenomination, getCurrencyInfo, getDenomFromIsoCode, getObjectDiff, truncateDecimals } from '../../util/utils.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { ButtonsModal } from '../modals/ButtonsModal.js'
import { QrModal } from '../modals/QrModal.js'
import { type WalletListResult, WalletListModal } from '../modals/WalletListModal.js'
import { Airship, showError, showToast } from '../services/AirshipInstance.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { Card } from '../themed/Card.js'
import { EdgeText } from '../themed/EdgeText.js'
import { type ExchangedFlipInputAmounts, ExchangedFlipInput } from '../themed/ExchangedFlipInput.js'
import { FiatText } from '../themed/FiatText.js'
import { FlipInput } from '../themed/FlipInput.js'
import { QrCode } from '../themed/QrCode'
import { ShareButtons } from '../themed/ShareButtons.js'

const PUBLIC_ADDRESS_REFRESH_MS = 2000

type OwnProps = {
  navigation: NavigationProp<'request'>
}
type StateProps = {
  currencyCode?: string,
  currencyIcon?: string,
  currencyInfo?: EdgeCurrencyInfo,
  edgeWallet?: EdgeCurrencyWallet,
  exchangeSecondaryToPrimaryRatio?: string,
  fioAddressesExist?: boolean,
  guiWallet?: GuiWallet,
  isConnected: boolean,
  legacyAddress: string,
  primaryCurrencyInfo?: GuiCurrencyInfo,
  publicAddress: string,
  secondaryCurrencyInfo?: GuiCurrencyInfo,
  useLegacyAddress?: boolean
}

type DispatchProps = {
  refreshReceiveAddressRequest: (walletId: string) => void,
  refreshAllFioAddresses: () => void,
  onSelectWallet: (walletId: string, currencyCode: string) => void
}
type ModalState = 'NOT_YET_SHOWN' | 'VISIBLE' | 'SHOWN'
type CurrencyMinimumPopupState = { [pluginId: string]: ModalState }

type Props = StateProps & DispatchProps & OwnProps & ThemeProps

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

  constructor(props: Props) {
    super(props)
    const minimumPopupModalState: CurrencyMinimumPopupState = {}
    Object.keys(SPECIAL_CURRENCY_INFO).forEach(pluginId => {
      if (getSpecialCurrencyInfo(pluginId).minimumPopupModals) {
        minimumPopupModalState[pluginId] = 'NOT_YET_SHOWN'
      }
    })
    this.state = {
      publicAddress: props.publicAddress,
      legacyAddress: props.legacyAddress,
      encodedURI: undefined,
      minimumPopupModalState,
      isFioMode: false
    }
    if (this.shouldShowMinimumModal(props)) {
      const { edgeWallet } = props
      if (edgeWallet == null) return
      this.state.minimumPopupModalState[edgeWallet.currencyInfo.pluginId] = 'VISIBLE'
      console.log('stop, in constructor')
      this.enqueueMinimumAmountModal()
    }
  }

  componentDidMount() {
    this.generateEncodedUri()
    this.props.refreshAllFioAddresses()
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
    const { edgeWallet, useLegacyAddress, currencyCode } = this.props
    if (!currencyCode) return
    let { publicAddress, legacyAddress } = this.props
    const abcEncodeUri = {
      publicAddress: useLegacyAddress ? legacyAddress : publicAddress,
      currencyCode
    }
    let encodedURI
    try {
      encodedURI = edgeWallet ? await edgeWallet.encodeUri(abcEncodeUri) : undefined
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
      setTimeout(() => {
        if (edgeWallet && edgeWallet.id) {
          this.props.refreshReceiveAddressRequest(edgeWallet.id)
        }
      }, PUBLIC_ADDRESS_REFRESH_MS)
    }
  }

  async componentDidUpdate(prevProps: Props) {
    const { currencyCode, edgeWallet, guiWallet, useLegacyAddress } = this.props
    if (guiWallet == null || edgeWallet == null || currencyCode == null) return
    const { pluginId } = edgeWallet.currencyInfo

    const didAddressChange = this.state.publicAddress !== guiWallet.receiveAddress.publicAddress
    const changeLegacyPublic = useLegacyAddress !== prevProps.useLegacyAddress
    const didWalletChange = prevProps.edgeWallet && edgeWallet.id !== prevProps.edgeWallet.id

    if (didAddressChange || changeLegacyPublic || didWalletChange) {
      let publicAddress = guiWallet.receiveAddress.publicAddress
      let legacyAddress = guiWallet.receiveAddress.legacyAddress

      const abcEncodeUri = useLegacyAddress ? { publicAddress, legacyAddress, currencyCode } : { publicAddress, currencyCode }
      let encodedURI
      try {
        encodedURI = await edgeWallet.encodeUri(abcEncodeUri)
      } catch (err) {
        console.log(err)
        publicAddress = s.strings.loading
        legacyAddress = s.strings.loading
        setTimeout(() => {
          refreshReceiveAddressRequest(edgeWallet.id)
        }, PUBLIC_ADDRESS_REFRESH_MS)
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
    const { edgeWallet } = this.props
    if (edgeWallet == null) return
    const { pluginId } = edgeWallet.currencyInfo
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
    const { currencyInfo, useLegacyAddress } = this.props
    const addressExplorer = currencyInfo ? currencyInfo.addressExplorer : null
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
    const { currencyIcon, exchangeSecondaryToPrimaryRatio, edgeWallet, guiWallet, primaryCurrencyInfo, secondaryCurrencyInfo, theme } = this.props
    const styles = getStyles(theme)

    if (guiWallet == null || primaryCurrencyInfo == null || secondaryCurrencyInfo == null || exchangeSecondaryToPrimaryRatio == null || edgeWallet == null) {
      return <ActivityIndicator color={theme.primaryText} style={styles.loader} size="large" />
    }

    const requestAddress = this.props.useLegacyAddress ? this.state.legacyAddress : this.state.publicAddress
    const flipInputHeaderText = sprintf(s.strings.send_to_wallet, getWalletName(edgeWallet))
    const { keysOnlyMode = false } = getSpecialCurrencyInfo(edgeWallet.currencyInfo.pluginId)

    // Balance
    const nativeBalance = getAvailableBalance(edgeWallet, primaryCurrencyInfo.displayCurrencyCode)
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
                  nativeCryptoAmount={primaryCurrencyInfo.displayDenomination.multiplier}
                  cryptoCurrencyCode={primaryCurrencyInfo.displayCurrencyCode}
                  isoFiatCurrencyCode={guiWallet.isoFiatCurrencyCode}
                  autoPrecision
                  appendFiatCurrencyCode
                  cryptoExchangeMultiplier={primaryCurrencyInfo.exchangeDenomination.multiplier}
                />
              </EdgeText>
            </View>

            {this.state.errorMessage != null ? <EdgeText style={styles.errorText}>{this.state.errorMessage}</EdgeText> : null}

            <Card marginRem={0}>
              <ExchangedFlipInput
                ref={this.flipInputRef}
                headerText={flipInputHeaderText}
                headerLogo={currencyIcon}
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
            <QrCode data={this.state.encodedURI} onPress={this.handleQrCodePress} />
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
      encodedURI = this.props.edgeWallet ? await this.props.edgeWallet.encodeUri(edgeEncodeUri) : undefined
    } catch (e) {
      console.log(e)
      setTimeout(() => {
        if (this.props.edgeWallet && this.props.edgeWallet.id) {
          this.props.refreshReceiveAddressRequest(this.props.edgeWallet.id)
        }
      }, PUBLIC_ADDRESS_REFRESH_MS)
    }

    this.setState({ encodedURI })
  }

  copyToClipboard = () => {
    const requestAddress = this.props.useLegacyAddress ? this.state.legacyAddress : this.state.publicAddress
    Clipboard.setString(requestAddress)
    showToast(s.strings.fragment_request_address_copied)
  }

  shouldShowMinimumModal = (props: Props): boolean => {
    const { currencyCode, edgeWallet } = props
    if (currencyCode == null || edgeWallet == null) return false
    const { pluginId } = edgeWallet.currencyInfo

    if (this.state.minimumPopupModalState[pluginId]) {
      if (this.state.minimumPopupModalState[pluginId] === 'NOT_YET_SHOWN') {
        const { minimumPopupModals } = getSpecialCurrencyInfo(pluginId)
        const minBalance = minimumPopupModals != null ? minimumPopupModals.minimumNativeBalance : '0'
        if (lt(edgeWallet.balances[currencyCode] ?? '0', minBalance)) {
          return true
        }
      }
    }
    return false
  }

  shareMessage = async () => {
    const { currencyCode, publicAddress, edgeWallet, currencyInfo, useLegacyAddress } = this.props
    const { legacyAddress } = this.state
    if (!currencyCode || !edgeWallet) {
      throw new Error('Wallet still loading. Please wait and try again.')
    }
    let sharedAddress = this.state.encodedURI ?? ''
    let edgePayUri = 'https://deep.edge.app/'
    let addOnMessage = ''
    // if encoded (like XTZ), only share the public address
    if (getSpecialCurrencyInfo(edgeWallet.currencyInfo.pluginId).isUriEncodedStructure) {
      sharedAddress = publicAddress
    } else {
      // Rebuild uri to preserve uriPrefix if amount is 0
      if (sharedAddress != null && sharedAddress.indexOf('amount') === -1) {
        const edgeEncodeUri: EdgeEncodeUri =
          useLegacyAddress && legacyAddress
            ? { publicAddress, legacyAddress, currencyCode, nativeAmount: '0' }
            : { publicAddress, currencyCode, nativeAmount: '0' }
        const newUri = await edgeWallet.encodeUri(edgeEncodeUri)
        sharedAddress = newUri.substring(0, newUri.indexOf('?'))
      }
      edgePayUri = edgePayUri + `pay/${sharedAddress.replace(':', '/')}`
      addOnMessage = `\n\n${sprintf(s.strings.request_qr_email_title, s.strings.app_name_short)}\n\n`
    }

    const subject = currencyInfo ? sprintf(s.strings.request_qr_email_subject, currencyInfo.displayName) : ''
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

export const Request = connect<StateProps, DispatchProps, OwnProps>(
  state => {
    const { account } = state.core
    const { currencyWallets } = account
    const guiWallet: GuiWallet = getSelectedWallet(state)
    const currencyCode: string = state.ui.wallets.selectedCurrencyCode

    const { allCurrencyInfos } = state.ui.settings.plugins
    const currencyInfo: EdgeCurrencyInfo | void = getCurrencyInfo(allCurrencyInfos, currencyCode)

    if (guiWallet == null || currencyCode == null) {
      return {
        publicAddress: '',
        legacyAddress: '',
        fioAddressesExist: false,
        isConnected: state.network.isConnected
      }
    }

    const edgeWallet: EdgeCurrencyWallet = currencyWallets[guiWallet.id]
    const primaryDisplayDenomination: GuiDenomination = getDisplayDenomination(state, edgeWallet.currencyInfo.pluginId, currencyCode)
    const primaryExchangeDenomination: GuiDenomination = getExchangeDenomination(state, edgeWallet.currencyInfo.pluginId, currencyCode)
    const secondaryExchangeDenomination: GuiDenomination = getDenomFromIsoCode(guiWallet.fiatCurrencyCode)
    const secondaryDisplayDenomination: GuiDenomination = secondaryExchangeDenomination
    const primaryExchangeCurrencyCode: string = primaryExchangeDenomination.name
    const secondaryExchangeCurrencyCode: string = secondaryExchangeDenomination.name ? secondaryExchangeDenomination.name : ''

    const primaryCurrencyInfo: GuiCurrencyInfo = {
      displayCurrencyCode: currencyCode,
      displayDenomination: primaryDisplayDenomination,
      exchangeCurrencyCode: primaryExchangeCurrencyCode,
      exchangeDenomination: primaryExchangeDenomination
    }
    const secondaryCurrencyInfo: GuiCurrencyInfo = {
      displayCurrencyCode: guiWallet.fiatCurrencyCode,
      displayDenomination: secondaryDisplayDenomination,
      exchangeCurrencyCode: secondaryExchangeCurrencyCode,
      exchangeDenomination: secondaryExchangeDenomination
    }
    const isoFiatCurrencyCode: string = guiWallet.isoFiatCurrencyCode
    const exchangeSecondaryToPrimaryRatio = getExchangeRate(state, currencyCode, isoFiatCurrencyCode)
    const fioAddressesExist = !!state.ui.scenes.fioAddress.fioAddresses.length

    // Icon
    const { pluginId, metaTokens } = edgeWallet.currencyInfo
    const contractAddress = metaTokens.find(token => token.currencyCode === currencyCode)?.contractAddress
    const currencyIcon = getCurrencyIcon(pluginId, contractAddress).symbolImage

    return {
      currencyCode,
      currencyInfo,
      currencyIcon,
      edgeWallet,
      exchangeSecondaryToPrimaryRatio,
      guiWallet,
      publicAddress: guiWallet?.receiveAddress?.publicAddress ?? '',
      legacyAddress: guiWallet?.receiveAddress?.legacyAddress ?? '',
      primaryCurrencyInfo,
      secondaryCurrencyInfo,
      useLegacyAddress: state.ui.scenes.requestType.useLegacyAddress,
      fioAddressesExist,
      isConnected: state.network.isConnected
    }
  },
  dispatch => ({
    refreshReceiveAddressRequest(walletId: string) {
      dispatch(refreshReceiveAddressRequest(walletId))
    },
    refreshAllFioAddresses() {
      dispatch(refreshAllFioAddresses())
    },
    onSelectWallet(walletId: string, currencyCode: string) {
      dispatch(selectWalletFromModal(walletId, currencyCode))
    }
  })
)(withTheme(RequestComponent))
