// @flow

import type { EdgeCurrencyConfig, EdgeCurrencyWallet, EdgeParsedUri } from 'edge-core-js'
import * as React from 'react'
import { Clipboard, TouchableHighlight, View } from 'react-native'
import { connect } from 'react-redux'

import { isLegacyAddressUri, isPaymentProtocolUri, isPrivateKeyUri } from '../../actions/ScanActions'
import { CURRENCY_PLUGIN_NAMES } from '../../constants/WalletAndCurrencyConstants'
import s from '../../locales/strings.js'
import { checkPubAddress } from '../../modules/FioAddress/util'
import FormattedText from '../../modules/UI/components/FormattedText/FormattedText.ui'
import type { RootState } from '../../reducers/RootReducer'
import { AddressModal } from '../modals/AddressModal'
import { Airship, showError } from '../services/AirshipInstance'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { ScanTile } from './ScanTile.js'
import { Tile } from './Tile.js'

type OwnProps = {
  coreWallet: EdgeCurrencyWallet,
  currencyCode: string,
  title: string,
  recipientAddress: string,
  onChangeAddress: (address: string, fioAddress?: string) => Promise<void>
}
type StateProps = {
  fioPlugin: EdgeCurrencyConfig | null
}
type State = {
  clipboard: string,
  resolvingAddress: boolean
}
type Props = OwnProps & StateProps & ThemeProps

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
          return showError(e.message)
        }
      }
    }
    try {
      const parsedUri: EdgeParsedUri = await coreWallet.parseUri(address, currencyCode)

      this.setState({ resolvingAddress: false })

      if (parsedUri.token) {
        // TOKEN URI
        // todo:
        return showError(s.strings.scan_invalid_address_error_title)
      }

      if (isLegacyAddressUri(parsedUri)) {
        // LEGACY ADDRESS URI
        // todo: showLegacyAddressModal
        return showError(s.strings.legacy_address_modal_title)
      }
      if (isPrivateKeyUri(parsedUri)) {
        // PRIVATE KEY URI
        // todo:
        return showError(s.strings.scan_invalid_address_error_title)
      }
      if (isPaymentProtocolUri(parsedUri)) {
        // todo: paymentProtocolUriReceived(parsedUri)
        return showError(s.strings.scan_invalid_address_error_title)
      }

      if (!parsedUri.publicAddress) {
        return showError(s.strings.scan_invalid_address_error_title)
      }

      // set address
      onChangeAddress(parsedUri.publicAddress, fioAddress)
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
      return <FormattedText style={styles.tilePlaceHolder}>{s.strings.resolving}</FormattedText>
    }

    return recipientAddress ? (
      <FormattedText ellipsizeMode="middle" numberOfLines={1} style={[styles.tileTextBottom, styles.rightSpace]}>
        {recipientAddress}
      </FormattedText>
    ) : (
      <FormattedText style={styles.tilePlaceHolder}>{s.strings.address_modal_default_header}</FormattedText>
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
            <View style={styles.tileChild}>
              <Tile type="editable" hideTitle title="" containerClass={styles.noBottomMargin} onPress={this.onAddressPress}>
                <View style={[styles.tileRow, styles.noVerticalMargin]}>{this.renderAddress()}</View>
              </Tile>
            </View>
            <View style={[styles.tileChild, styles.tileChildNoBorder]}>
              <ScanTile onScan={this.onScan} />
            </View>
          </View>
          {copyMessage && (
            <View style={styles.tileContainerButtons}>
              <TouchableHighlight underlayColor={theme.secondaryButton} onPress={this.onPasteFromClipboard} style={styles.pasteButton}>
                <FormattedText ellipsizeMode="middle" numberOfLines={1} style={styles.tileTextBottom}>
                  {copyMessage}
                </FormattedText>
              </TouchableHighlight>
            </View>
          )}
        </View>
      </View>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  tileChild: {
    flex: 1,
    borderColor: theme.deactivatedText,
    borderTopWidth: theme.rem(0.05),
    borderRightWidth: theme.rem(0.05),
    borderBottomWidth: theme.rem(0.05)
  },
  tileChildNoBorder: {
    borderRightWidth: 0
  },
  tileContainerButtons: {
    backgroundColor: theme.tileBackground,
    padding: theme.rem(0.5),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  tileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: theme.rem(0.25)
  },
  tileRowParent: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  tileTextBottom: {
    color: theme.primaryText,
    fontSize: theme.rem(1)
  },
  tilePlaceHolder: {
    color: theme.deactivatedText,
    fontSize: theme.rem(1)
  },
  noVerticalMargin: {
    marginVertical: 0
  },
  noBottomMargin: {
    marginBottom: 0
  },
  pasteButton: {
    width: '100%',
    backgroundColor: 'transparent'
  },
  rightSpace: {
    paddingRight: '20%'
  },
  recipientBlock: {
    marginBottom: theme.rem(0.125)
  },
  loader: {
    paddingVertical: theme.rem(0.075)
  }
}))

export const AddressTile = connect((state: RootState): StateProps => {
  const { account } = state.core
  return {
    fioPlugin: account.currencyConfig ? account.currencyConfig[CURRENCY_PLUGIN_NAMES.FIO] : null
  }
})(withTheme(AddressTileComponent))
