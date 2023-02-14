import Clipboard from '@react-native-clipboard/clipboard'
import { EdgeAccount, EdgeCurrencyConfig, EdgeCurrencyWallet, EdgeParsedUri } from 'edge-core-js'
import { ethers } from 'ethers'
import * as React from 'react'
import { AppState, TouchableOpacity, View } from 'react-native'
import AntDesign from 'react-native-vector-icons/AntDesign'
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5'
import { sprintf } from 'sprintf-js'

import { launchPaymentProto } from '../../actions/PaymentProtoActions'
import { addressWarnings } from '../../actions/ScanActions'
import s from '../../locales/strings'
import { checkPubAddress } from '../../modules/FioAddress/util'
import { PaymentProtoError } from '../../types/PaymentProtoError'
import { connect } from '../../types/reactRedux'
import { NavigationBase } from '../../types/routerTypes'
import { getTokenId } from '../../util/CurrencyInfoHelpers'
import { parseDeepLink } from '../../util/DeepLinkParser'
import { AddressModal } from '../modals/AddressModal'
import { ScanModal } from '../modals/ScanModal'
import { WalletListModal, WalletListResult } from '../modals/WalletListModal'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, ThemeProps, withTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { Tile } from './Tile'

export interface ChangeAddressResult {
  fioAddress?: string
  parsedUri?: EdgeParsedUri
}

interface OwnProps {
  coreWallet: EdgeCurrencyWallet
  currencyCode: string
  title: string
  recipientAddress: string
  onChangeAddress: (changeAddressResult: ChangeAddressResult) => Promise<void>
  resetSendTransaction: () => void
  lockInputs?: boolean
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
  constructor(props: Props) {
    super(props)

    this.state = {
      clipboard: '',
      loading: false
    }
  }

  componentDidMount(): void {
    AppState.addEventListener('change', this.handleAppStateChange)

    this._setClipboard()
    if (this.props.isCameraOpen) {
      this.handleScan()
    }
  }

  componentWillUnmount(): void {
    AppState.removeEventListener('change', this.handleAppStateChange)
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.isCameraOpen && !prevProps.isCameraOpen) {
      this.handleScan()
    }
  }

  handleAppStateChange = (appState: string) => {
    if (appState === 'active') this._setClipboard()
  }

  onChangeAddress = async (address: string) => {
    if (address == null || address === '') return
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
    if (coreWallet.currencyInfo.pluginId === 'ethereum' && /^.*\.eth$/.test(address)) {
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
        await launchPaymentProto(navigation, this.props.account, parsedUri.paymentProtocolUrl, { wallet: coreWallet }).catch(showError)

        return
      }

      if (!parsedUri.publicAddress) {
        return showError(s.strings.scan_invalid_address_error_title)
      }

      // set address
      onChangeAddress({ fioAddress, parsedUri })
    } catch (e: any) {
      const currencyInfo = coreWallet.currencyInfo
      const ercTokenStandard = currencyInfo.defaultSettings?.otherSettings?.ercTokenStandard ?? ''
      const parsedLink = { ...parseDeepLink(address) }
      if (parsedLink.type === 'paymentProto') {
        if (ercTokenStandard === 'ERC20') {
          showError(new PaymentProtoError('CurrencyNotSupported', { text: currencyInfo.currencyCode }))
        } else {
          await launchPaymentProto(navigation, this.props.account, parsedLink.uri, { wallet: coreWallet }).catch(showError)
        }
      } else {
        showError(`${s.strings.scan_invalid_address_error_title} ${s.strings.scan_invalid_address_error_description}`)
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
    this.onChangeAddress(clipboard)
  }

  handleScan = () => {
    const { currencyCode } = this.props
    const title = sprintf(s.strings.send_scan_modal_text_modal_title_s, currencyCode)
    const message = sprintf(s.strings.send_scan_modal_text_modal_message_s, currencyCode)
    Airship.show<string | undefined>(bridge => (
      <ScanModal
        bridge={bridge}
        title={s.strings.scan_qr_label}
        textModalHint={s.strings.send_scan_modal_text_modal_hint}
        textModalBody={message}
        textModalTitle={title}
      />
    ))
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

  handleSelfTransfer = async () => {
    const { account, coreWallet, navigation, currencyCode } = this.props
    const { currencyWallets } = account
    const { pluginId } = coreWallet.currencyInfo
    await Airship.show<WalletListResult>(bridge => (
      <WalletListModal
        bridge={bridge}
        headerTitle={s.strings.your_wallets}
        navigation={navigation}
        allowedAssets={[{ pluginId, tokenId: getTokenId(account, pluginId, currencyCode) }]}
        excludeWalletIds={[coreWallet.id]}
      />
    )).then(async ({ walletId }) => {
      if (walletId != null) {
        const wallet = currencyWallets[walletId]
        const receiveAddress = await wallet.getReceiveAddress()
        if (receiveAddress == null) return
        this.onChangeAddress(receiveAddress.publicAddress)
      }
    })
  }

  handleTilePress = () => {
    const { lockInputs, recipientAddress } = this.props
    if (!lockInputs && !!recipientAddress) {
      this._setClipboard()
      this.props.resetSendTransaction()
    }
  }

  render() {
    const { fioToAddress, recipientAddress, lockInputs, theme, title, coreWallet, account } = this.props
    const { pluginId, currencyCode } = coreWallet.currencyInfo
    const { currencyWallets } = account
    const { loading } = this.state
    const styles = getStyles(theme)
    const copyMessage = this.state.clipboard ? `${s.strings.string_paste}: ${this.state.clipboard}` : null
    const tileType = loading ? 'loading' : !!recipientAddress && !lockInputs ? 'delete' : 'static'
    const tokenId: string | undefined = getTokenId(this.props.account, pluginId, currencyCode)
    const canSelfTransfer: boolean = Object.keys(currencyWallets).some(walletId => {
      if (walletId === coreWallet.id) return false
      if (currencyWallets[walletId].type !== coreWallet.type) return false
      if (tokenId == null) return true
      return currencyWallets[walletId].enabledTokenIds.includes(tokenId)
    })
    return (
      <View>
        <Tile type={tileType} title={title} onPress={this.handleTilePress}>
          {!recipientAddress && (
            <View style={styles.buttonsContainer}>
              <TouchableOpacity style={styles.buttonContainer} onPress={this.handleChangeAddress}>
                <FontAwesome name="edit" size={theme.rem(2)} color={theme.iconTappable} />
                <EdgeText style={styles.buttonText}>{s.strings.enter_as_in_enter_address_with_keyboard}</EdgeText>
              </TouchableOpacity>
              {canSelfTransfer ? (
                <TouchableOpacity style={styles.buttonContainer} onPress={this.handleSelfTransfer}>
                  <AntDesign name="wallet" size={theme.rem(2)} color={theme.iconTappable} />
                  <EdgeText style={styles.buttonText}>{s.strings.fragment_send_myself}</EdgeText>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity style={styles.buttonContainer} onPress={this.handleScan}>
                <FontAwesome5 name="expand" size={theme.rem(2)} color={theme.iconTappable} />
                <EdgeText style={styles.buttonText}>{s.strings.scan_as_in_scan_barcode}</EdgeText>
              </TouchableOpacity>
              {copyMessage ? (
                <TouchableOpacity style={styles.buttonContainer} onPress={this.handlePasteFromClipboard}>
                  <FontAwesome5 name="clipboard" size={theme.rem(2)} color={theme.iconTappable} />
                  <EdgeText style={styles.buttonText}>{s.strings.string_paste}</EdgeText>
                </TouchableOpacity>
              ) : null}
            </View>
          )}
          {recipientAddress == null || recipientAddress === '' ? null : (
            <>
              {fioToAddress == null ? null : <EdgeText>{fioToAddress + '\n'}</EdgeText>}
              <EdgeText numberOfLines={3} disableFontScaling>
                {recipientAddress}
              </EdgeText>
            </>
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

export const AddressTile2 = connect<StateProps, {}, OwnProps>(
  state => ({
    account: state.core.account,
    fioPlugin: state.core.account.currencyConfig.fio
  }),
  dispatch => ({})
)(withTheme(AddressTileComponent))
