// @flow

import Clipboard from '@react-native-community/clipboard'
import type { EdgeCurrencyConfig, EdgeCurrencyWallet, EdgeParsedUri, EdgeSpendTarget, EdgeTransaction } from 'edge-core-js'
import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5'
import { connect } from 'react-redux'

import { CURRENCY_PLUGIN_NAMES } from '../../constants/WalletAndCurrencyConstants'
import s from '../../locales/strings.js'
import { checkPubAddress } from '../../modules/FioAddress/util'
import type { RootState } from '../../reducers/RootReducer'
import type { FeeOption } from '../../reducers/scenes/SendConfirmationReducer'
import type { FioRequest } from '../../types/types'
import { AddressModal } from '../modals/AddressModal'
import { ButtonsModal } from '../modals/ButtonsModal'
import { ScanModal } from '../modals/ScanModal.js'
import { Airship, showError } from '../services/AirshipInstance'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from './EdgeText'
import { FadeHeight } from './FadeHeight'
import { Tile } from './Tile.js'

type SpendInfo = {
  currencyCode?: string,
  metadata?: any,
  nativeAmount?: string,
  networkFeeOption?: FeeOption,
  customNetworkFee?: Object,
  publicAddress?: string,
  spendTargets?: EdgeSpendTarget[],
  lockInputs?: boolean,
  uniqueIdentifier?: string,
  otherParams?: Object,
  dismissAlert?: boolean,
  fioAddress?: string,
  fioPendingRequest?: FioRequest,
  isSendUsingFioAddress?: boolean,
  onBack?: () => void,
  onDone?: (error: Error | null, edgeTransaction?: EdgeTransaction) => void,
  beforeTransaction?: () => Promise<void>
}

type OwnProps = {
  coreWallet: EdgeCurrencyWallet,
  currencyCode: string,
  title: string,
  recipientAddress: string,
  onChangeAddress: (address: string, spendInfo?: SpendInfo) => Promise<void>
}
type StateProps = {
  fioPlugin: EdgeCurrencyConfig | null
}
type State = {
  clipboard: string,
  loading: boolean,
  isSetAddress: boolean
}
type Props = OwnProps & StateProps & ThemeProps

const isLegacyAddressUri = (parsedUri: EdgeParsedUri): boolean => {
  return !!parsedUri.legacyAddress
}

const isPaymentProtocolUri = (parsedUri: EdgeParsedUri): boolean => {
  // $FlowFixMe should be paymentProtocolUrl (lowercased)?
  return !!parsedUri.paymentProtocolURL && !parsedUri.publicAddress
}

const BITPAY = {
  domain: 'bitpay.com',
  merchantName: (memo: string) => {
    // Example BitPay memo
    // "Payment request for BitPay invoice DKffym7WxX6kzJ73yfYS7s for merchant Electronic Frontier Foundation"
    // eslint-disable-next-line no-unused-vars
    const [_, merchantName] = memo.split(' for merchant ')
    return merchantName
  }
}

class AddressTileComponent extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      clipboard: '',
      loading: false,
      isSetAddress: false
    }
  }

  componentDidMount(): void {
    this._setClipboard(this.props)
  }

  shouldContinueLegacy = async () => {
    const response = await Airship.show(bridge => (
      <ButtonsModal
        bridge={bridge}
        title={s.strings.legacy_address_modal_title}
        message={s.strings.legacy_address_modal_warning}
        buttons={{
          confirm: { label: s.strings.legacy_address_modal_continue },
          cancel: { label: s.strings.legacy_address_modal_cancel, type: 'secondary' }
        }}
      />
    ))
    if (response === 'confirm') {
      return true
    }

    return false
  }

  paymentProtocolUriReceived = async ({ paymentProtocolURL }: { paymentProtocolURL?: string }) => {
    const { coreWallet, onChangeAddress } = this.props
    try {
      if (!paymentProtocolURL) throw new Error('no paymentProtocolURL prop')
      const paymentProtocolInfo = await coreWallet.getPaymentProtocolInfo(paymentProtocolURL)
      const { domain, memo, nativeAmount, spendTargets } = paymentProtocolInfo

      const name = domain === BITPAY.domain ? BITPAY.merchantName(memo) : domain
      const notes = memo
      const spendInfo = {
        lockInputs: true,
        networkFeeOption: 'standard',
        metadata: {
          name,
          notes
        },
        nativeAmount,
        spendTargets,
        otherParams: { paymentProtocolInfo }
      }
      onChangeAddress(spendTargets.length && spendTargets[0].publicAddress ? spendTargets[0].publicAddress : '', spendInfo)
    } catch (e) {
      console.log(e)
      await Airship.show(bridge => (
        <ButtonsModal
          bridge={bridge}
          title={s.strings.scan_invalid_address_error_title}
          message={s.strings.scan_invalid_address_error_description}
          buttons={{
            ok: { label: s.strings.string_ok }
          }}
        />
      ))
    }
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
      } catch (e) {
        if (!e.code || e.code !== fioPlugin.currencyInfo.defaultSettings.errorCodes.INVALID_FIO_ADDRESS) {
          this.setState({ loading: false })
          return showError(e)
        }
      }
    }
    try {
      const parsedUri: EdgeParsedUri & { paymentProtocolURL?: string } = await coreWallet.parseUri(address, currencyCode)

      this.setState({ loading: false })

      if (isLegacyAddressUri(parsedUri)) {
        if (!(await this.shouldContinueLegacy())) return
      }

      if (isPaymentProtocolUri(parsedUri)) {
        return this.paymentProtocolUriReceived(parsedUri)
      }

      if (!parsedUri.publicAddress) {
        return showError(s.strings.scan_invalid_address_error_title)
      }

      // set address
      onChangeAddress(parsedUri.publicAddress, { fioAddress })
      this.setState({ isSetAddress: true })
    } catch (e) {
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
      this.setState({ loading: false })
      // Failure is acceptable
    }
  }

  handlePasteFromClipboard = () => {
    const { clipboard } = this.state
    this.onChangeAddress(clipboard)
  }

  handleScan = () => {
    Airship.show(bridge => <ScanModal bridge={bridge} title={s.strings.scan_qr_label} />)
      .then((result: string) => {
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
    if (this.state.isSetAddress) {
      this.setState({ isSetAddress: false })
    }
  }

  render() {
    const { recipientAddress, theme, title } = this.props
    const { loading, isSetAddress } = this.state
    const styles = getStyles(theme)
    const copyMessage = this.state.clipboard ? `${s.strings.string_paste}: ${this.state.clipboard}` : null
    const tileType = loading ? 'loading' : isSetAddress ? 'touchable' : 'static'
    return (
      <View>
        <Tile type={tileType} title={title} body={recipientAddress || undefined} onPress={this.handleTilePress}>
          <FadeHeight visible={!isSetAddress}>
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
          </FadeHeight>
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
    alignItems: 'center',
    height: theme.rem(5)
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center'
  },
  buttonText: {
    marginTop: theme.rem(0.25),
    fontSize: theme.rem(0.75),
    color: theme.textLink
  }
}))

export const AddressTile = connect((state: RootState): StateProps => {
  const { account } = state.core
  return {
    fioPlugin: account.currencyConfig ? account.currencyConfig[CURRENCY_PLUGIN_NAMES.FIO] : null
  }
})(withTheme(AddressTileComponent))
