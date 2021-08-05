// @flow
import Clipboard from '@react-native-community/clipboard'
import type { EdgeCurrencyConfig, EdgeCurrencyWallet, EdgeParsedUri } from 'edge-core-js'
import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5'
import { sprintf } from 'sprintf-js'

import { addNewToken } from '../../actions/AddTokenActions'
import { ADD_TOKEN } from '../../constants/SceneKeys'
import { CURRENCY_PLUGIN_NAMES } from '../../constants/WalletAndCurrencyConstants'
import s from '../../locales/strings.js'
import { checkExpiredFioAddress, checkPubAddress } from '../../modules/FioAddress/util'
import { type GuiMakeSpendInfo } from '../../reducers/scenes/SendConfirmationReducer.js'
import { connect } from '../../types/reactRedux.js'
import { AddressModal } from '../modals/AddressModal'
import { paymentProtocolUriReceived } from '../modals/paymentProtocolUriReceived.js'
import { ScanModal } from '../modals/ScanModal.js'
import { shouldContinueLegacy } from '../modals/shouldContinueLegacy.js'
import { Airship, showError } from '../services/AirshipInstance'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from './EdgeText'
import { Tile } from './Tile.js'

type OwnProps = {
  coreWallet: EdgeCurrencyWallet,
  currencyCode: string,
  title: string,
  recipientAddress: string,
  onChangeAddress: (guiMakeSpendInfo: GuiMakeSpendInfo, parsedUri?: EdgeParsedUri) => Promise<void>,
  resetSendTransaction: () => void,
  lockInputs?: boolean,
  addressTileRef: any,
  isCameraOpen: boolean,
  fioToAddress?: string
}
type StateProps = {
  fioPlugin?: EdgeCurrencyConfig,
  fioWallets: EdgeCurrencyWallet[]
}
type State = {
  clipboard: string,
  loading: boolean
}
type DispatchProps = {
  addNewToken: (walletId: string, currencyName: string, currencyCode: string, contractAddress: string, denomination: string, type: string) => void
}
type Props = OwnProps & StateProps & ThemeProps & DispatchProps

const isLegacyAddressUri = (parsedUri: EdgeParsedUri): boolean => {
  return !!parsedUri.legacyAddress
}

const isPaymentProtocolUri = (parsedUri: EdgeParsedUri): boolean => {
  // $FlowFixMe should be paymentProtocolUrl (lowercased)?
  return !!parsedUri.paymentProtocolURL && !parsedUri.publicAddress
}

class AddressTileComponent extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      clipboard: '',
      loading: false
    }
  }

  componentDidMount(): void {
    this._setClipboard(this.props)
    this.props.addressTileRef(this)
    if (this.props.isCameraOpen) {
      this.handleScan()
    }
  }

  componentWillUnmount(): void {
    this.props.addressTileRef(undefined)
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.isCameraOpen && !prevProps.isCameraOpen) {
      this.handleScan()
    }
  }

  reset() {
    this._setClipboard(this.props)
    this.props.resetSendTransaction()
  }

  checkIfFioAddressExpired = async (address: string) => {
    if (await checkExpiredFioAddress(this.props.fioWallets[0], address)) {
      throw new Error(s.strings.fio_address_expired)
    }
  }

  onChangeAddress = async (address: string) => {
    if (!address) return
    const { onChangeAddress, coreWallet, currencyCode, fioPlugin } = this.props

    this.setState({ loading: true })

    let fioAddress
    if (fioPlugin) {
      try {
        await this.checkIfFioAddressExpired(address)
        const publicAddress = await checkPubAddress(fioPlugin, address.toLowerCase(), coreWallet.currencyInfo.currencyCode, currencyCode)
        fioAddress = address.toLowerCase()
        address = publicAddress
      } catch (e) {
        if (!e.code || e.code !== fioPlugin.currencyInfo.defaultSettings.errorCodes.INVALID_FIO_ADDRESS) {
          this.setState({ loading: false })
          return showError(e)
        }
      }
    }

    try {
      const parsedUri: EdgeParsedUri & { paymentProtocolURL?: string } = await coreWallet.parseUri(address, currencyCode)

      if (parsedUri.token != null) {
        const { currencyCode, /* currencyName, */ contractAddress, denominations } = parsedUri.token
        // Find the first denomination for the currencyCode
        const denomination = denominations.find(d => d.name === currencyCode)

        // If no contract address or denomination is found, then we show an invalid token error
        if (contractAddress == null || denomination == null) {
          showError(`${s.strings.scan_invalid_token_error_title} ${s.strings.scan_invalid_token_error_description}`)
          return
        }

        // If the token is already added to the wallet, then show an error message to the user
        const enabledTokens = await coreWallet.getEnabledTokens()
        if (enabledTokens.indexOf(currencyCode) !== -1) {
          showError(sprintf(s.strings.scan_address_add_token_exists_err_message, currencyCode, coreWallet.name))
          this.setState({ loading: false })
          return
        }

        // Redirect to the wallet list scene
        Actions.push(ADD_TOKEN, {
          walletId: coreWallet.id,
          metaToken: parsedUri.token,
          onAddToken: Actions.pop
        })

        this.setState({ loading: false })
        return
      }

      if (isLegacyAddressUri(parsedUri)) {
        this.setState({ loading: false })
        if (!(await shouldContinueLegacy())) return
      }

      // Missing isPrivateKeyUri Modal

      if (isPaymentProtocolUri(parsedUri)) {
        const guiMakeSpendInfo: ?GuiMakeSpendInfo = await paymentProtocolUriReceived(parsedUri, coreWallet)

        if (guiMakeSpendInfo) {
          onChangeAddress(guiMakeSpendInfo)
        }

        this.setState({ loading: false })
        return
      }

      if (!parsedUri.publicAddress) {
        this.setState({ loading: false })
        return showError(s.strings.scan_invalid_address_error_title)
      }

      // set address
      onChangeAddress({ fioAddress, isSendUsingFioAddress: !!fioAddress }, parsedUri)
    } catch (e) {
      console.warn(e)
      showError(`${s.strings.scan_invalid_address_error_title} ${s.strings.scan_invalid_address_error_description}`)
      this.setState({ loading: false })
    }
  }

  _setClipboard = async props => {
    const coreWallet = props.coreWallet

    try {
      this.setState({ loading: true })
      const uri = await Clipboard.getString()

      // Will throw in case uri is invalid
      await coreWallet.parseUri(uri)

      this.setState({
        clipboard: uri,
        loading: false
      })
    } catch (e) {
      this.setState({ loading: false, clipboard: '' })
      // Failure is acceptable
    }
  }

  handlePasteFromClipboard = () => {
    const { clipboard } = this.state
    this.onChangeAddress(clipboard)
  }

  handleScan = () => {
    Airship.show(bridge => <ScanModal bridge={bridge} title={s.strings.scan_qr_label} />)
      .then((result: string | void) => {
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
    Airship.show(bridge => <AddressModal bridge={bridge} walletId={coreWallet.id} currencyCode={currencyCode} title={s.strings.scan_address_modal_title} />)
      .then((result: string | null) => {
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
      this.reset()
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
            <EdgeText numberOfLines={3} adjustsFontSizeToFit={false}>
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

const AddressTileConnector = connect<StateProps, DispatchProps, OwnProps>(
  state => ({
    fioToAddress: state.ui.scenes.sendConfirmation.guiMakeSpendInfo?.fioAddress,
    fioPlugin: state.core.account.currencyConfig[CURRENCY_PLUGIN_NAMES.FIO],
    fioWallets: state.ui.wallets.fioWallets
  }),
  dispatch => ({
    addNewToken(walletId: string, currencyName: string, currencyCode: string, contractAddress: string, denomination: string, walletType: string) {
      dispatch(addNewToken(walletId, currencyName, currencyCode, contractAddress, denomination, walletType))
    }
  })
)(withTheme(AddressTileComponent))

// $FlowFixMe - forwardRef is not recognize by flow?
export const AddressTile = React.forwardRef((props, ref) => <AddressTileConnector {...props} addressTileRef={ref} />) // eslint-disable-line
