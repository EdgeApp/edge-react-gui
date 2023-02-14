import Clipboard from '@react-native-clipboard/clipboard'
import { lt, lte } from 'biggystring'
import { EdgeAccount, EdgeCurrencyWallet, EdgeEncodeUri } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, InputAccessoryView, Linking, Platform, Text, TouchableOpacity, View } from 'react-native'
import Share from 'react-native-share'
import IonIcon from 'react-native-vector-icons/Ionicons'
import { sprintf } from 'sprintf-js'

import { refreshAllFioAddresses } from '../../actions/FioAddressActions'
import { selectWalletToken } from '../../actions/WalletActions'
import { Fontello } from '../../assets/vector'
import { getSpecialCurrencyInfo, SPECIAL_CURRENCY_INFO } from '../../constants/WalletAndCurrencyConstants'
import s from '../../locales/strings'
import { getDisplayDenomination, getExchangeDenomination } from '../../selectors/DenominationSelectors'
import { getExchangeRate } from '../../selectors/WalletSelectors'
import { config } from '../../theme/appConfig'
import { connect } from '../../types/reactRedux'
import { NavigationBase, NavigationProp } from '../../types/routerTypes'
import { GuiCurrencyInfo, GuiDenomination } from '../../types/types'
import { getTokenId } from '../../util/CurrencyInfoHelpers'
import { getAvailableBalance, getWalletName } from '../../util/CurrencyWalletHelpers'
import { convertNativeToDenomination, getDenomFromIsoCode, truncateDecimals } from '../../util/utils'
import { Card } from '../cards/Card'
import { SceneWrapper } from '../common/SceneWrapper'
import { ButtonsModal } from '../modals/ButtonsModal'
import { showWebViewModal } from '../modals/HelpModal'
import { QrModal } from '../modals/QrModal'
import { WalletListModal, WalletListResult } from '../modals/WalletListModal'
import { Airship, showError, showToast } from '../services/AirshipInstance'
import { cacheStyles, Theme, ThemeProps, withTheme } from '../services/ThemeContext'
import { FiatText } from '../text/FiatText'
import { AddressQr } from '../themed/AddressQr'
import { Carousel } from '../themed/Carousel'
import { EdgeText } from '../themed/EdgeText'
import { ExchangedFlipInput, ExchangedFlipInputAmounts } from '../themed/ExchangedFlipInput'
import { FlipInput } from '../themed/FlipInput'
import { MainButton } from '../themed/MainButton'
import { SceneHeader } from '../themed/SceneHeader'
import { ShareButtons } from '../themed/ShareButtons'

interface OwnProps {
  navigation: NavigationProp<'request'>
}
interface StateProps {
  account: EdgeAccount
  currencyCode?: string
  wallet?: EdgeCurrencyWallet
  exchangeSecondaryToPrimaryRatio?: string
  fioAddressesExist?: boolean
  isConnected: boolean
  primaryCurrencyInfo?: GuiCurrencyInfo
  secondaryCurrencyInfo?: GuiCurrencyInfo
}

interface DispatchProps {
  refreshAllFioAddresses: () => void
  onSelectWallet: (navigation: NavigationBase, walletId: string, tokenId?: string) => void
}
type ModalState = 'NOT_YET_SHOWN' | 'VISIBLE' | 'SHOWN'
interface CurrencyMinimumPopupState {
  [pluginId: string]: ModalState
}

type Props = StateProps & DispatchProps & OwnProps & ThemeProps

interface State {
  addresses: AddressInfo[]
  selectedAddress?: AddressInfo
  amounts?: ExchangedFlipInputAmounts
  minimumPopupModalState: CurrencyMinimumPopupState
  isFioMode: boolean
  errorMessage?: string
}

interface AddressInfo {
  addressString: string
  label: string
}

const inputAccessoryViewID: string = 'cancelHeaderId'

export class RequestSceneComponent extends React.Component<Props, State> {
  flipInput: React.ElementRef<typeof FlipInput> | null = null
  unsubscribeAddressChanged: (() => void) | undefined

  constructor(props: Props) {
    super(props)
    const minimumPopupModalState: CurrencyMinimumPopupState = {}
    Object.keys(SPECIAL_CURRENCY_INFO).forEach(pluginId => {
      if (getSpecialCurrencyInfo(pluginId).minimumPopupModals) {
        minimumPopupModalState[pluginId] = 'NOT_YET_SHOWN'
      }
    })
    this.state = {
      addresses: [],
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
    this.getAddressItems()
    this.props.refreshAllFioAddresses()
    if (this.props.wallet != null) {
      this.unsubscribeAddressChanged = this.props.wallet.on('addressChanged', async () => this.getAddressItems())
    }
  }

  componentWillUnmount() {
    if (this.unsubscribeAddressChanged != null) this.unsubscribeAddressChanged()
  }

  async getAddressItems() {
    const { wallet, currencyCode } = this.props
    if (currencyCode == null) return
    if (wallet == null) return

    const receiveAddress = await wallet.getReceiveAddress()
    const addresses: AddressInfo[] = []

    // Handle segwitAddress
    if (receiveAddress.segwitAddress != null) {
      addresses.push({
        addressString: receiveAddress.segwitAddress,
        label: s.strings.request_qr_your_segwit_address
      })
    }
    // Handle publicAddress
    addresses.push({
      addressString: receiveAddress.publicAddress,
      label: receiveAddress.segwitAddress != null ? s.strings.request_qr_your_wrapped_segwit_address : s.strings.request_qr_your_wallet_address
    })
    // Handle legacyAddress
    if (receiveAddress.legacyAddress != null) {
      addresses.push({
        addressString: receiveAddress.legacyAddress,
        label: s.strings.request_qr_your_legacy_address
      })
    }

    this.setState({ addresses, selectedAddress: addresses[0] })
  }

  async getEncodedUri(): Promise<string | undefined> {
    const { wallet, currencyCode } = this.props
    const { amounts, selectedAddress } = this.state

    if (wallet == null || currencyCode == null || selectedAddress == null) return

    return await wallet.encodeUri({ currencyCode, publicAddress: selectedAddress.addressString, nativeAmount: amounts?.nativeAmount })
  }

  async componentDidUpdate(prevProps: Props, prevState: State) {
    const { currencyCode, wallet } = this.props
    if (wallet == null || currencyCode == null) return

    const { pluginId } = wallet.currencyInfo

    const didAddressChange = prevState.selectedAddress !== this.state.selectedAddress
    const didWalletChange = prevProps.wallet && wallet.id !== prevProps.wallet.id

    if (didWalletChange) {
      this.getAddressItems()
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

    await Airship.show<'ok' | undefined>(bridge => (
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

  flipInputRef = (ref: ExchangedFlipInput | null) => {
    if (ref?.flipInput) {
      this.flipInput = ref.flipInput
    }
  }

  handleAddressBlockExplorer = () => {
    const { wallet } = this.props
    const addressExplorer = wallet != null ? wallet.currencyInfo.addressExplorer : null
    if (this.state.selectedAddress == null) return
    const requestAddress = this.state.selectedAddress.addressString

    Airship.show<'confirm' | 'cancel' | undefined>(bridge => (
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
        return result === 'confirm' && addressExplorer != null ? Linking.openURL(sprintf(addressExplorer, requestAddress)) : null
      })
      .catch(error => console.log(error))
  }

  handleOpenWalletListModal = () => {
    const { account } = this.props
    Airship.show<WalletListResult>(bridge => <WalletListModal bridge={bridge} headerTitle={s.strings.select_wallet} navigation={this.props.navigation} />).then(
      ({ walletId, currencyCode }: WalletListResult) => {
        if (walletId && currencyCode) {
          const wallet = account.currencyWallets[walletId]
          const tokenId = getTokenId(account, wallet.currencyInfo.pluginId, currencyCode)
          this.props.onSelectWallet(this.props.navigation, walletId, tokenId)
        }
      }
    )
  }

  onError = (errorMessage?: string) => this.setState({ errorMessage })

  handleKeysOnlyModePress = () => showWebViewModal(config.supportSite, s.strings.help_support)
  renderKeysOnlyMode = () => {
    const styles = getStyles(this.props.theme)
    return (
      <SceneWrapper background="theme" hasTabs={false}>
        <SceneHeader withTopMargin underline title={sprintf(s.strings.request_deprecated_header, this.props.primaryCurrencyInfo?.displayCurrencyCode)} />
        <Text style={styles.keysOnlyModeText}>{sprintf(s.strings.request_deprecated_currency_code, this.props.primaryCurrencyInfo?.displayCurrencyCode)}</Text>
        <MainButton onPress={this.handleKeysOnlyModePress} label={s.strings.help_support} marginRem={2} type="secondary">
          <Fontello name="help_headset" color={this.props.theme.iconTappable} size={this.props.theme.rem(1.5)} />
        </MainButton>
      </SceneWrapper>
    )
  }

  handleChangeAddressItem = (item: AddressInfo) => {
    this.setState({ selectedAddress: item })
  }

  handlePressAddressItem = async (encodedUri?: string) => {
    Airship.show(bridge => <QrModal bridge={bridge} data={encodedUri} />)
  }

  render() {
    const { currencyCode, exchangeSecondaryToPrimaryRatio, wallet, primaryCurrencyInfo, secondaryCurrencyInfo, theme } = this.props
    const styles = getStyles(theme)

    if (currencyCode == null || primaryCurrencyInfo == null || secondaryCurrencyInfo == null || exchangeSecondaryToPrimaryRatio == null || wallet == null) {
      return <ActivityIndicator color={theme.primaryText} style={styles.loader} size="large" />
    }

    const selectedAddress = this.state.selectedAddress
    const requestAddress = selectedAddress?.addressString ?? s.strings.loading
    const flipInputHeaderText = sprintf(s.strings.send_to_wallet, getWalletName(wallet))
    const { keysOnlyMode = false } = getSpecialCurrencyInfo(wallet.currencyInfo.pluginId)
    const addressExplorerDisabled = wallet.currencyInfo.addressExplorer === ''

    // Balance
    const nativeBalance = getAvailableBalance(wallet, primaryCurrencyInfo.displayCurrencyCode)
    const displayBalanceAmount = convertNativeToDenomination(primaryCurrencyInfo.displayDenomination.multiplier)(nativeBalance)
    const displayBalanceString = sprintf(s.strings.request_balance, `${truncateDecimals(displayBalanceAmount)} ${primaryCurrencyInfo.displayDenomination.name}`)

    // Selected denomination
    const denomString = `1 ${primaryCurrencyInfo.displayDenomination.name}`

    return keysOnlyMode ? (
      this.renderKeysOnlyMode()
    ) : (
      <SceneWrapper background="header" hasTabs={false}>
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
              onExchangeAmountChanged={this.onExchangeAmountChanged}
              keyboardVisible={false}
              isFiatOnTop
              isFocus={false}
              onNext={this.onNext}
              topReturnKeyType={this.state.isFioMode ? 'next' : 'done'}
              inputAccessoryViewID={this.state.isFioMode ? inputAccessoryViewID : undefined}
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
          <Carousel
            items={this.state.addresses}
            keyExtractor={item => item.addressString}
            onChangeItem={this.handleChangeAddressItem}
            renderItem={item => (
              <AddressQr
                address={item.addressString}
                wallet={wallet}
                currencyCode={currencyCode}
                nativeAmount={this.state.amounts?.nativeAmount}
                onPress={this.handlePressAddressItem}
              />
            )}
          />
          <TouchableOpacity disabled={addressExplorerDisabled} onPress={this.handleAddressBlockExplorer}>
            <View style={styles.rightChevronContainer}>
              <EdgeText>{selectedAddress?.label ?? s.strings.request_qr_your_wallet_address}</EdgeText>
              {addressExplorerDisabled ? null : <IonIcon name="chevron-forward" size={theme.rem(1.5)} color={theme.iconTappable} />}
            </View>
            <EdgeText style={styles.publicAddressText}>{requestAddress}</EdgeText>
          </TouchableOpacity>
        </View>

        <ShareButtons shareViaShare={this.shareViaShare} copyToClipboard={this.copyToClipboard} fioAddressModal={this.fioAddressModal} />
      </SceneWrapper>
    )
  }

  onExchangeAmountChanged = async (amounts: ExchangedFlipInputAmounts) => {
    this.setState({ amounts })
  }

  copyToClipboard = async (uri?: string) => {
    try {
      const encodedUri = uri ?? (await this.getEncodedUri())
      if (encodedUri != null) {
        Clipboard.setString(encodedUri)
        showToast(s.strings.fragment_request_address_uri_copied)
      }
    } catch (error) {
      showError(error)
    }
  }

  shouldShowMinimumModal = (props: Props): boolean => {
    const { currencyCode, wallet } = props
    if (currencyCode == null || wallet == null) return false

    // No minimums for tokens
    if (currencyCode !== wallet.currencyInfo.currencyCode) return false
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
    const { currencyCode, wallet } = this.props
    const { selectedAddress } = this.state
    if (currencyCode == null || wallet == null || selectedAddress == null) {
      throw new Error('Wallet still loading. Please wait and try again.')
    }
    const publicAddress = selectedAddress.addressString
    let sharedAddress = (await this.getEncodedUri()) ?? publicAddress
    let edgePayUri = 'https://deep.edge.app/'
    let addOnMessage = ''
    // if encoded (like XTZ), only share the public address
    if (getSpecialCurrencyInfo(wallet.currencyInfo.pluginId).isUriEncodedStructure) {
      sharedAddress = publicAddress
    } else {
      // Rebuild uri to preserve uriPrefix if amount is 0
      if (sharedAddress != null && !sharedAddress.includes('amount')) {
        const edgeEncodeUri: EdgeEncodeUri = { publicAddress, currencyCode, nativeAmount: '0' }
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
    if (this.state.amounts == null || lte(this.state.amounts.nativeAmount, '0')) {
      if (Platform.OS === 'android') {
        showError(`${s.strings.fio_request_by_fio_address_error_invalid_amount_header}. ${s.strings.fio_request_by_fio_address_error_invalid_amount}`)
        return
      } else {
        this.fioMode()
        return
      }
    }
    navigation.navigate('fioRequestConfirmation', {
      amounts: this.state.amounts
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
    if (this.state.isFioMode && (!this.state.amounts || lte(this.state.amounts.nativeAmount, '0'))) {
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
  keysOnlyModeText: {
    padding: theme.rem(1),
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(1),
    color: theme.primaryText
  },
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

export const RequestScene = connect<StateProps, DispatchProps, OwnProps>(
  state => {
    const { account } = state.core
    const { currencyWallets } = account
    const walletId = state.ui.wallets.selectedWalletId
    const currencyCode: string = state.ui.wallets.selectedCurrencyCode
    const wallet: EdgeCurrencyWallet = currencyWallets[walletId]

    if (currencyCode == null || wallet == null) {
      return {
        account,
        publicAddress: '',
        fioAddressesExist: false,
        isConnected: state.network.isConnected
      }
    }

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
      account,
      currencyCode,
      wallet,
      exchangeSecondaryToPrimaryRatio,
      primaryCurrencyInfo,
      secondaryCurrencyInfo,
      fioAddressesExist,
      isConnected: state.network.isConnected
    }
  },
  dispatch => ({
    refreshAllFioAddresses() {
      dispatch(refreshAllFioAddresses())
    },
    onSelectWallet(navigation: NavigationBase, walletId: string, tokenId?: string) {
      dispatch(selectWalletToken({ navigation, walletId, tokenId }))
    }
  })
)(withTheme(RequestSceneComponent))
