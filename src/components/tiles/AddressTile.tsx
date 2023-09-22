import Clipboard from '@react-native-clipboard/clipboard'
import { EdgeAccount, EdgeCurrencyConfig, EdgeCurrencyWallet, EdgeParsedUri } from 'edge-core-js'
import { ethers } from 'ethers'
import * as React from 'react'
import { AppState, NativeEventSubscription, TouchableOpacity, View } from 'react-native'
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5'
import { sprintf } from 'sprintf-js'

import { launchPaymentProto } from '../../actions/PaymentProtoActions'
import { addressWarnings } from '../../actions/ScanActions'
import { ENS_DOMAINS } from '../../constants/WalletAndCurrencyConstants'
import { lstrings } from '../../locales/strings'
import { PaymentProtoError } from '../../types/PaymentProtoError'
import { connect } from '../../types/reactRedux'
import { NavigationBase } from '../../types/routerTypes'
import { GuiMakeSpendInfo } from '../../types/types'
import { parseDeepLink } from '../../util/DeepLinkParser'
import { checkPubAddress } from '../../util/FioAddressUtils'
import { AddressModal } from '../modals/AddressModal'
import { ScanModal } from '../modals/ScanModal'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, ThemeProps, withTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { Tile } from './Tile'

interface OwnProps {
  coreWallet: EdgeCurrencyWallet
  currencyCode: string
  title: string
  recipientAddress: string
  onChangeAddress: (guiMakeSpendInfo: GuiMakeSpendInfo, parsedUri?: EdgeParsedUri) => Promise<void>
  resetSendTransaction: () => void
  lockInputs?: boolean
  addressTileRef: any
  isCameraOpen: boolean
  fioToAddress?: string
  navigation: NavigationBase
}
interface StateProps {
  account: EdgeAccount
  fioPlugin?: EdgeCurrencyConfig
}
interface State {
  clipboard: string
  loading: boolean
}
type Props = OwnProps & StateProps & ThemeProps

export interface AddressTileRef {
  onChangeAddress: (address: string) => Promise<void>
}

export class AddressTileComponent extends React.PureComponent<Props, State> {
  listener: NativeEventSubscription | undefined

  constructor(props: Props) {
    super(props)

    this.state = {
      clipboard: '',
      loading: false
    }
  }

  componentDidMount(): void {
    this.listener = AppState.addEventListener('change', this.handleAppStateChange)

    this._setClipboard().catch(err => showError(err))
    this.props.addressTileRef(this)
    if (this.props.isCameraOpen) {
      this.handleScan()
    }
  }

  componentWillUnmount(): void {
    if (this.listener != null) this.listener.remove()

    this.props.addressTileRef(undefined)
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.isCameraOpen && !prevProps.isCameraOpen) {
      this.handleScan()
    }
  }

  handleAppStateChange = (appState: string) => {
    if (appState === 'active') this._setClipboard().catch(err => showError(err))
  }

  onChangeAddress = async (address: string) => {
    if (!address) return
    const { onChangeAddress, coreWallet, currencyCode, fioPlugin, navigation } = this.props

    this.setState({ loading: true })
    let fioAddress
    if (fioPlugin) {
      try {
        const publicAddress = await checkPubAddress(fioPlugin, address.toLowerCase(), coreWallet.currencyInfo.currencyCode, currencyCode)
        fioAddress = address.toLowerCase()
        address = publicAddress
      } catch (e: any) {
        if (!e.code || e.code !== fioPlugin.currencyInfo.defaultSettings.errorCodes.INVALID_FIO_ADDRESS) {
          this.setState({ loading: false })
          return showError(e)
        }
      }
    }

    // Try resolving address by ENS domain for ethereum wallets only
    if (coreWallet.currencyInfo.pluginId === 'ethereum' && ENS_DOMAINS.some(domain => address.endsWith(domain))) {
      const chainId = 1 // Hard-coded to Ethereum mainnet
      const network = ethers.providers.getNetwork(chainId)
      if (network.name !== 'unknown') {
        try {
          const ethersProvider = ethers.getDefaultProvider(network)
          const resolvedAddress = await ethersProvider.resolveName(address)
          if (resolvedAddress != null) address = resolvedAddress
        } catch (_) {}
      }
    }

    try {
      const parsedUri: EdgeParsedUri & { paymentProtocolUrl?: string } = await coreWallet.parseUri(address, currencyCode)
      this.setState({ loading: false })

      // Check if the URI requires a warning to the user
      const approved = await addressWarnings(parsedUri, currencyCode)
      if (!approved) return

      // Missing isPrivateKeyUri Modal
      // Check is PaymentProtocolUri
      if (!!parsedUri.paymentProtocolUrl && !parsedUri.publicAddress) {
        await launchPaymentProto(navigation, this.props.account, parsedUri.paymentProtocolUrl, {
          currencyCode,
          navigateReplace: true,
          wallet: coreWallet
        }).catch(showError)

        return
      }

      if (!parsedUri.publicAddress) {
        return showError(lstrings.scan_invalid_address_error_title)
      }

      // set address
      await onChangeAddress({ fioAddress, isSendUsingFioAddress: !!fioAddress }, parsedUri)
    } catch (err: any) {
      const currencyInfo = coreWallet.currencyInfo
      const ercTokenStandard = currencyInfo.defaultSettings?.otherSettings?.ercTokenStandard ?? ''
      const parsedLink = { ...parseDeepLink(address) }
      if (parsedLink.type === 'paymentProto') {
        if (ercTokenStandard === 'ERC20') {
          showError(new PaymentProtoError('CurrencyNotSupported', { text: currencyInfo.currencyCode }))
        } else {
          await launchPaymentProto(navigation, this.props.account, parsedLink.uri, { currencyCode, navigateReplace: true, wallet: coreWallet }).catch(showError)
        }
      } else {
        showError(`${lstrings.scan_invalid_address_error_title} ${lstrings.scan_invalid_address_error_description}`)
      }

      this.setState({ loading: false })
    }
  }

  _setClipboard = async () => {
    const { coreWallet, currencyCode } = this.props

    try {
      this.setState({ loading: true })
      const uri = await Clipboard.getString()

      // Will throw in case uri is invalid
      await coreWallet.parseUri(uri, currencyCode)

      this.setState({
        clipboard: uri,
        loading: false
      })
    } catch (e: any) {
      this.setState({ loading: false, clipboard: '' })
      // Failure is acceptable
    }
  }

  handlePasteFromClipboard = () => {
    const { clipboard } = this.state
    this.onChangeAddress(clipboard).catch(err => showError(err))
  }

  handleScan = () => {
    const { currencyCode } = this.props
    const title = sprintf(lstrings.send_scan_modal_text_modal_title_s, currencyCode)
    const message = sprintf(lstrings.send_scan_modal_text_modal_message_s, currencyCode)
    Airship.show<string | undefined>(bridge => (
      <ScanModal
        bridge={bridge}
        title={lstrings.scan_qr_label}
        textModalHint={lstrings.send_scan_modal_text_modal_hint}
        textModalBody={message}
        textModalTitle={title}
      />
    ))
      .then((result: string | undefined) => {
        if (result) {
          return this.onChangeAddress(result)
        }
      })
      .catch(error => {
        showError(error)
      })
  }

  handleChangeAddress = async () => {
    const { coreWallet, currencyCode } = this.props
    Airship.show<string | undefined>(bridge => (
      <AddressModal bridge={bridge} walletId={coreWallet.id} currencyCode={currencyCode} title={lstrings.scan_address_modal_title} />
    ))
      .then(result => {
        if (result) {
          return this.onChangeAddress(result)
        }
      })
      .catch(error => {
        showError(error)
      })
  }

  handleTilePress = () => {
    const { lockInputs, recipientAddress } = this.props
    if (!lockInputs && !!recipientAddress) {
      this._setClipboard()
        .then(() => {
          this.props.resetSendTransaction()
        })
        .catch(err => showError(err))
    }
  }

  render() {
    const { fioToAddress, recipientAddress, lockInputs, theme, title } = this.props
    const { loading } = this.state
    const styles = getStyles(theme)
    const copyMessage = this.state.clipboard ? `${lstrings.string_paste}: ${this.state.clipboard}` : null
    const tileType = loading ? 'loading' : !!recipientAddress && !lockInputs ? 'touchable' : 'static'
    return (
      <View>
        <Tile type={tileType} title={title} onPress={this.handleTilePress}>
          {!recipientAddress && (
            <View style={styles.buttonsContainer}>
              <TouchableOpacity style={styles.buttonContainer} onPress={this.handleChangeAddress}>
                <FontAwesome name="edit" size={theme.rem(2)} color={theme.iconTappable} />
                <EdgeText style={styles.buttonText}>{lstrings.enter_as_in_enter_address_with_keyboard}</EdgeText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.buttonContainer} onPress={this.handleScan}>
                <FontAwesome5 name="expand" size={theme.rem(2)} color={theme.iconTappable} />
                <EdgeText style={styles.buttonText}>{lstrings.scan_as_in_scan_barcode}</EdgeText>
              </TouchableOpacity>
              {copyMessage && (
                <TouchableOpacity style={styles.buttonContainer} onPress={this.handlePasteFromClipboard}>
                  <FontAwesome5 name="clipboard" size={theme.rem(2)} color={theme.iconTappable} />
                  <EdgeText style={styles.buttonText}>{lstrings.string_paste}</EdgeText>
                </TouchableOpacity>
              )}
            </View>
          )}
          {fioToAddress == null ? null : <EdgeText>{fioToAddress + '\n'}</EdgeText>}
          {recipientAddress == null ? null : (
            <EdgeText numberOfLines={3} disableFontScaling>
              {recipientAddress}
            </EdgeText>
          )}
        </Tile>
      </View>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  buttonsContainer: {
    paddingTop: theme.rem(1),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center'
  },
  buttonText: {
    fontSize: theme.rem(0.75),
    color: theme.textLink
  }
}))

const AddressTileConnector = connect<StateProps, {}, OwnProps>(
  state => ({
    account: state.core.account,
    fioToAddress: state.ui.sendConfirmation.guiMakeSpendInfo?.fioAddress,
    fioPlugin: state.core.account.currencyConfig.fio
  }),
  dispatch => ({})
)(withTheme(AddressTileComponent))

export const AddressTile = React.forwardRef<AddressTileRef, Omit<OwnProps, 'addressTileRef'>>((props, ref) => (
  <AddressTileConnector {...props} addressTileRef={ref} />
))
