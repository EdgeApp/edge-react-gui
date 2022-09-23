import Clipboard from '@react-native-clipboard/clipboard'
import { EdgeCurrencyConfig, EdgeCurrencyWallet, EdgeParsedUri } from 'edge-core-js'
import * as React from 'react'
import { AppState, TouchableOpacity, View } from 'react-native'
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5'

import { launchBitPay } from '../../actions/BitPayActions'
import { addressWarnings } from '../../actions/ScanActions'
import s from '../../locales/strings'
import { checkPubAddress } from '../../modules/FioAddress/util'
import { BitPayError } from '../../types/BitPayError'
import { connect } from '../../types/reactRedux'
import { GuiMakeSpendInfo } from '../../types/types'
import { parseDeepLink } from '../../util/DeepLinkParser'
import { AddressModal } from '../modals/AddressModal'
import { ScanModal } from '../modals/ScanModal'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, ThemeProps, withTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { Tile } from './Tile'

type OwnProps = {
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
}
type StateProps = {
  fioPlugin?: EdgeCurrencyConfig
}
type State = {
  clipboard: string
  loading: boolean
}
type Props = OwnProps & StateProps & ThemeProps

export interface AddressTileRef {
  onChangeAddress: (address: string) => Promise<void>
}

export class AddressTileComponent extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      clipboard: '',
      loading: false
    }
  }

  componentDidMount(): void {
    AppState.addEventListener('change', this.handleAppStateChange)

    this._setClipboard(this.props)
    this.props.addressTileRef(this)
    if (this.props.isCameraOpen) {
      this.handleScan()
    }
  }

  componentWillUnmount(): void {
    AppState.removeEventListener('change', this.handleAppStateChange)

    this.props.addressTileRef(undefined)
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.isCameraOpen && !prevProps.isCameraOpen) {
      this.handleScan()
    }
  }

  handleAppStateChange = (appState: string) => {
    if (appState === 'active') this._setClipboard(this.props)
  }

  onChangeAddress = async (address: string) => {
    if (!address) return
    const { onChangeAddress, coreWallet, currencyCode, fioPlugin } = this.props

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
    try {
      const parsedUri: EdgeParsedUri & { paymentProtocolUrl?: string } = await coreWallet.parseUri(address, currencyCode)
      this.setState({ loading: false })

      // Check if the URI requires a warning to the user
      const approved = await addressWarnings(parsedUri, currencyCode)
      if (!approved) return

      // Missing isPrivateKeyUri Modal
      // Check is PaymentProtocolUri
      if (!!parsedUri.paymentProtocolUrl && !parsedUri.publicAddress) {
        await launchBitPay(parsedUri.paymentProtocolUrl, { wallet: coreWallet }).catch(showError)

        return
      }

      if (!parsedUri.publicAddress) {
        return showError(s.strings.scan_invalid_address_error_title)
      }

      // set address
      onChangeAddress({ fioAddress, isSendUsingFioAddress: !!fioAddress }, parsedUri)
    } catch (e: any) {
      const currencyInfo = coreWallet.currencyInfo
      const ercTokenStandard = currencyInfo.defaultSettings?.otherSettings?.ercTokenStandard ?? ''
      const parsedLink = { ...parseDeepLink(address) }
      if (parsedLink.type === 'bitPay') {
        if (ercTokenStandard === 'ERC20') {
          showError(new BitPayError('CurrencyNotSupported', { text: currencyInfo.currencyCode }))
        } else {
          await launchBitPay(parsedLink.uri, { wallet: coreWallet }).catch(showError)
        }
      } else {
        showError(`${s.strings.scan_invalid_address_error_title} ${s.strings.scan_invalid_address_error_description}`)
      }

      this.setState({ loading: false })
    }
  }

  // @ts-expect-error
  _setClipboard = async props => {
    const { coreWallet, currencyCode } = props

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
    this.onChangeAddress(clipboard)
  }

  handleScan = () => {
    Airship.show<string | undefined>(bridge => <ScanModal bridge={bridge} title={s.strings.scan_qr_label} />)
      .then((result: string | undefined) => {
        if (result) {
          this.onChangeAddress(result)
        }
      })
      .catch(error => {
        showError(error)
      })
  }

  handleChangeAddress = async () => {
    const { coreWallet, currencyCode } = this.props
    Airship.show<string | undefined>(bridge => (
      <AddressModal bridge={bridge} walletId={coreWallet.id} currencyCode={currencyCode} title={s.strings.scan_address_modal_title} />
    ))
      .then(result => {
        if (result) {
          this.onChangeAddress(result)
        }
      })
      .catch(error => {
        showError(error)
      })
  }

  handleTilePress = () => {
    const { lockInputs, recipientAddress } = this.props
    if (!lockInputs && !!recipientAddress) {
      this._setClipboard(this.props)
      this.props.resetSendTransaction()
    }
  }

  render() {
    const { fioToAddress, recipientAddress, lockInputs, theme, title } = this.props
    const { loading } = this.state
    const styles = getStyles(theme)
    const copyMessage = this.state.clipboard ? `${s.strings.string_paste}: ${this.state.clipboard}` : null
    const tileType = loading ? 'loading' : !!recipientAddress && !lockInputs ? 'touchable' : 'static'
    return (
      <View>
        <Tile type={tileType} title={title} onPress={this.handleTilePress}>
          {!recipientAddress && (
            <View style={styles.buttonsContainer}>
              <TouchableOpacity style={styles.buttonContainer} onPress={this.handleChangeAddress}>
                <FontAwesome name="edit" size={theme.rem(2)} color={theme.iconTappable} />
                <EdgeText style={styles.buttonText}>{s.strings.enter_as_in_enter_address_with_keyboard}</EdgeText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.buttonContainer} onPress={this.handleScan}>
                <FontAwesome5 name="expand" size={theme.rem(2)} color={theme.iconTappable} />
                <EdgeText style={styles.buttonText}>{s.strings.scan_as_in_scan_barcode}</EdgeText>
              </TouchableOpacity>
              {copyMessage && (
                <TouchableOpacity style={styles.buttonContainer} onPress={this.handlePasteFromClipboard}>
                  <FontAwesome5 name="clipboard" size={theme.rem(2)} color={theme.iconTappable} />
                  <EdgeText style={styles.buttonText}>{s.strings.string_paste}</EdgeText>
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
    fioToAddress: state.ui.scenes.sendConfirmation.guiMakeSpendInfo?.fioAddress,
    fioPlugin: state.core.account.currencyConfig.fio
  }),
  dispatch => ({})
)(withTheme(AddressTileComponent))

export const AddressTile = React.forwardRef<AddressTileRef, Omit<OwnProps, 'addressTileRef'>>((props, ref) => (
  <AddressTileConnector {...props} addressTileRef={ref} />
))
