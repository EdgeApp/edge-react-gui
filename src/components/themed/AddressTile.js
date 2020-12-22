// @flow

import Clipboard from '@react-native-community/clipboard'
import type { EdgeCurrencyConfig, EdgeCurrencyWallet, EdgeParsedUri, EdgeSpendTarget, EdgeTransaction } from 'edge-core-js'
import * as React from 'react'
import { TouchableWithoutFeedback, View } from 'react-native'
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import { connect } from 'react-redux'

import { CURRENCY_PLUGIN_NAMES } from '../../constants/WalletAndCurrencyConstants'
import s from '../../locales/strings.js'
import { checkPubAddress } from '../../modules/FioAddress/util'
import type { RootState } from '../../reducers/RootReducer'
import type { FeeOption } from '../../reducers/scenes/SendConfirmationReducer'
import type { FioRequest } from '../../types/types'
import { AddressModal } from '../modals/AddressModal'
import { ButtonsModal } from '../modals/ButtonsModal'
import { Airship, showError } from '../services/AirshipInstance'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from './EdgeText'
import { ScanTile } from './ScanTile.js'
import { ClickableText } from './ThemedButtons'
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
  resolvingAddress: boolean
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
      resolvingAddress: false
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

    this.setState({ resolvingAddress: true })
    let fioAddress
    if (fioPlugin) {
      try {
        const publicAddress = await checkPubAddress(fioPlugin, address.toLowerCase(), coreWallet.currencyInfo.currencyCode, currencyCode)
        fioAddress = address.toLowerCase()
        address = publicAddress
      } catch (e) {
        if (!e.code || e.code !== fioPlugin.currencyInfo.defaultSettings.errorCodes.INVALID_FIO_ADDRESS) {
          this.setState({ resolvingAddress: false })
          return showError(e)
        }
      }
    }
    try {
      const parsedUri: EdgeParsedUri & { paymentProtocolURL?: string } = await coreWallet.parseUri(address, currencyCode)

      this.setState({ resolvingAddress: false })

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
    } catch (e) {
      showError(`${s.strings.scan_invalid_address_error_title} ${s.strings.scan_invalid_address_error_description}`)
      this.setState({ resolvingAddress: false })
    }
  }

  _setClipboard = async props => {
    const coreWallet = props.coreWallet

    try {
      const uri = await Clipboard.getString()

      // Will throw in case uri is invalid
      await coreWallet.parseUri(uri)

      this.setState({
        clipboard: uri
      })
    } catch (e) {
      // Failure is acceptable
    }
  }

  onPasteFromClipboard = () => {
    const { clipboard } = this.state
    this.onChangeAddress(clipboard)
  }

  changeRecipient = async () => {
    const { coreWallet, currencyCode } = this.props
    const address = await Airship.show(bridge => (
      <AddressModal bridge={bridge} walletId={coreWallet.id} currencyCode={currencyCode} title={s.strings.scan_address_modal_title} />
    ))
    if (address) {
      this.onChangeAddress(address)
    }
  }

  onScan = async result => {
    if (result) {
      this.onChangeAddress(result)
    }
  }

  onAddressPress = (): void => {
    this.changeRecipient()
  }

  renderAddress() {
    const { theme, recipientAddress } = this.props
    const { resolvingAddress } = this.state
    const styles = getStyles(theme)
    if (resolvingAddress) {
      return <EdgeText style={styles.tilePlaceHolder}>{s.strings.resolving}</EdgeText>
    }

    return recipientAddress ? (
      <>
        <EdgeText ellipsizeMode="middle" numberOfLines={1} style={[styles.tileTextBottom, styles.rightSpace]}>
          {recipientAddress}
        </EdgeText>
        <FontAwesome name="edit" style={styles.editIcon} />
      </>
    ) : (
      <>
        <EdgeText style={[styles.tilePlaceHolder, styles.rightSpace]}>{s.strings.address_modal_default_header}</EdgeText>
        <FontAwesome name="edit" style={styles.editIcon} />
      </>
    )
  }

  render() {
    const { theme, title } = this.props
    const styles = getStyles(theme)
    const copyMessage = this.state.clipboard ? `${s.strings.string_paste}: ${this.state.clipboard}` : null
    return (
      <View>
        <Tile type="static" containerClass={styles.noBottomMargin} title={title} />
        <View style={styles.recipientBlock}>
          <View style={styles.tileRowParent}>
            <TouchableWithoutFeedback onPress={this.onAddressPress}>
              <View style={[styles.tileRow, styles.tileChildSideBorder]}>{this.renderAddress()}</View>
            </TouchableWithoutFeedback>
            <ScanTile onScan={this.onScan} />
          </View>
          {copyMessage && (
            <View style={styles.tileContainerButtons}>
              <ClickableText onPress={this.onPasteFromClipboard} style={styles.pasteButton}>
                <EdgeText ellipsizeMode="middle" numberOfLines={1} style={styles.tileTextBottom}>
                  {copyMessage}
                </EdgeText>
              </ClickableText>
            </View>
          )}
        </View>
      </View>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  tileContainerButtons: {
    backgroundColor: theme.tileBackground,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  tileRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.tileBackground,
    paddingHorizontal: theme.rem(0.75),
    paddingVertical: theme.rem(0.5)
  },
  tileRowParent: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: theme.deactivatedText,
    borderTopWidth: theme.rem(0.05),
    borderBottomWidth: theme.rem(0.05)
  },
  tileChildSideBorder: {
    borderColor: theme.deactivatedText,
    borderRightWidth: theme.rem(0.05)
  },
  tileTextBottom: {
    color: theme.primaryText,
    fontSize: theme.rem(1)
  },
  tilePlaceHolder: {
    color: theme.deactivatedText,
    fontSize: theme.rem(1)
  },
  noBottomMargin: {
    marginBottom: 0
  },
  pasteButton: {
    width: '100%',
    backgroundColor: 'transparent',
    padding: theme.rem(0.75),
    margin: 0
  },
  rightSpace: {
    maxWidth: '90%',
    paddingRight: theme.rem(0.75)
  },
  recipientBlock: {
    marginBottom: theme.rem(0.125)
  },
  loader: {
    paddingVertical: theme.rem(0.075)
  },
  editIcon: {
    color: theme.iconTappable,
    fontSize: theme.rem(1)
  }
}))

export const AddressTile = connect((state: RootState): StateProps => {
  const { account } = state.core
  return {
    fioPlugin: account.currencyConfig ? account.currencyConfig[CURRENCY_PLUGIN_NAMES.FIO] : null
  }
})(withTheme(AddressTileComponent))
