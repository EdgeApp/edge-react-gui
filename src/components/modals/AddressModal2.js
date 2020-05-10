// @flow

import { FormField, TertiaryButton } from 'edge-components'
import type { EdgeAccount, EdgeCurrencyConfig, EdgeCurrencyWallet } from 'edge-core-js'
import React, { Component, Fragment } from 'react'
import { Clipboard, FlatList, Image, InputAccessoryView, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native'
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome'
import { sprintf } from 'sprintf-js'

import ENS_LOGO from '../../assets/images/ens_logo.png'
import FIO_LOGO from '../../assets/images/fio_logo.png'
import s from '../../locales/strings.js'
import { checkPubAddress, getFioAddressCache } from '../../modules/FioAddress/util.js'
import Text from '../../modules/UI/components/FormattedText/index'
import styles, { addressInputStyles, iconStyles } from '../../styles/components/ScanAddressModal.js'
import type { FlatListItem } from '../../types/types.js'
import ResolutionError, { ResolutionErrorCode } from '../common/ResolutionError.js'
import { type AirshipBridge, AirshipModal, dayText, IconCircle } from './modalParts.js'

const MODAL_ICON = 'address-book-o'
const inputAccessoryViewID: string = 'inputAccessoryViewID'

export type AddressModalOpts = {
  walletId: string,
  coreWallet: EdgeCurrencyWallet,
  fioPlugin: EdgeCurrencyConfig,
  currencyCode: string
}

type Props = {
  bridge: AirshipBridge<string | null>,
  coreWallet: EdgeCurrencyWallet,
  fioPlugin: EdgeCurrencyConfig,
  currencyCode: string,
  account: EdgeAccount
}

type State = {
  clipboard: string,
  uri: string,
  statusLabel: string,
  fieldError: string,
  cryptoAddress?: string,
  fioAddresses: string[]
}

export class AddressModal2 extends Component<Props, State> {
  fioCheckQueue: number = 0

  constructor (props: Props) {
    super(props)
    this.fioCheckQueue = 0
    this.state = {
      clipboard: '',
      uri: '',
      statusLabel: s.strings.fragment_send_address,
      cryptoAddress: undefined,
      fieldError: '',
      fioAddresses: []
    }
  }

  componentDidMount () {
    this._setClipboard(this.props)
    this.setFioAddresses()
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

  setFioAddresses = async () => {
    const fioAddressesObject = await getFioAddressCache(this.props.account)
    const fioAddresses = fioAddressesObject.addresses ? Object.keys(fioAddressesObject.addresses) : []
    this.setState({ fioAddresses: fioAddresses.sort() })
  }

  setStatusLabel = (status: string) => {
    this.setState({ statusLabel: status })
  }

  setCryptoAddress = (address?: string) => {
    this.setState({ cryptoAddress: address })
  }

  onChangeTextDelayed = (domain: string) => {
    const { currencyCode } = this.props
    if (this.checkIfDomain(domain)) {
      this.resolveAddress(domain, currencyCode)
    }
    this.checkIfFioAddress(domain)
    this.updateUri(domain)
  }

  checkIfDomain = (domain: string): boolean => {
    return this.checkIfUnstoppableDomain(domain) || this.checkIfEnsDomain(domain)
  }

  checkIfUnstoppableDomain = (domain: string): boolean => {
    return domain.endsWith('.zil') || domain.endsWith('.crypto')
  }

  checkIfEnsDomain = (domain: string): boolean => {
    return domain.endsWith('.eth') || domain.endsWith('.luxe') || domain.endsWith('.kred') || domain.endsWith('.xyz')
  }

  fetchDomain = async (domain: string, currencyTicker: string): Promise<string> => {
    domain = domain.trim().toLowerCase()
    if (!this.checkIfDomain(domain)) {
      throw new ResolutionError(ResolutionErrorCode.UnsupportedDomain, { domain })
    }
    const baseurl = `https://unstoppabledomains.com/api/v1`
    const url = this.checkIfEnsDomain(domain) ? `${baseurl}/${domain}/${currencyTicker}` : `${baseurl}/${domain}`
    const response = await global.fetch(url).then(res => res.json())
    const { addresses, meta } = response
    if (!meta || !meta.owner) {
      throw new ResolutionError(ResolutionErrorCode.UnregisteredDomain, { domain })
    }
    const ticker = currencyTicker.toUpperCase()
    if (!addresses || !addresses[ticker]) {
      throw new ResolutionError(ResolutionErrorCode.UnspecifiedCurrency, { domain, currencyTicker })
    }
    return addresses[ticker]
  }

  resolveAddress = async (domain: string, currencyTicker: string) => {
    if (!domain) return
    try {
      this.setStatusLabel(s.strings.resolving)
      const addr = await this.fetchDomain(domain, currencyTicker)
      this.setStatusLabel(addr)
      this.setCryptoAddress(addr)
    } catch (err) {
      if (err instanceof ResolutionError) {
        const message = sprintf(s.strings[err.code], domain, currencyTicker)
        if (domain === '') this.setStatusLabel(s.strings.fragment_send_address)
        else {
          this.setStatusLabel(message)
          this.setCryptoAddress(undefined)
        }
      }
    }
  }

  checkFioPubAddressQueue (uri: string) {
    this.setStatusLabel(s.strings.resolving)
    this.fioCheckQueue++
    setTimeout(async () => {
      // do not check if user continue typing fio address
      if (this.fioCheckQueue > 1) {
        return --this.fioCheckQueue
      }
      this.fioCheckQueue = 0
      try {
        const { currencyCode, coreWallet, fioPlugin } = this.props
        const publicAddress = await checkPubAddress(fioPlugin, uri.toLowerCase(), coreWallet.currencyInfo.currencyCode, currencyCode)
        this.setStatusLabel(s.strings.fragment_send_address)
        if (!publicAddress) {
          return this.setState({ fieldError: s.strings.err_no_address_title })
        }
      } catch (e) {
        this.setStatusLabel(s.strings.fragment_send_address)
        return this.setState({ fieldError: e.message })
      }
    }, 1000)
  }

  async checkIfFioAddress (uri: string) {
    this.setState({ fieldError: '' })

    if (await this.isFioAddressValid(uri)) {
      this.checkFioPubAddressQueue(uri)
    }
  }

  isFioAddressValid = (fioAddress: string) => {
    const { fioPlugin } = this.props
    return fioPlugin.otherMethods.isFioAddressValid(fioAddress)
  }

  updateUri = (uri: string) => {
    this.setState({
      uri
    })
  }

  onPasteFromClipboard = () => {
    const { clipboard } = this.state
    this.setState({ uri: clipboard }, async () => {
      if (await this.isFioAddressValid(clipboard)) {
        await this.checkIfFioAddress(clipboard)
      }
      this.handleSubmit()
    })
  }

  onPressFioAddress = (address: string) => {
    this.setState({ uri: address }, async () => {
      if (await this.isFioAddressValid(address)) {
        await this.checkIfFioAddress(address)
      }
      this.handleSubmit()
    })
  }

  renderFioAddressRow = ({ item }: FlatListItem<string>) => {
    let addressType
    if (this.checkIfDomain(item)) {
      addressType = ENS_LOGO
    } else if (item.includes('@')) {
      addressType = FIO_LOGO
    } else {
      return null
    }
    return (
      <TouchableWithoutFeedback onPress={() => this.onPressFioAddress(item)}>
        <View style={styles.tileContainer}>
          <Image source={addressType} style={styles.fioAddressAvatarContainer} resizeMode={'cover'} />
          <Text style={styles.fioAddressText}>{item}</Text>
        </View>
      </TouchableWithoutFeedback>
    )
  }

  handleSubmit = () => {
    const { uri, cryptoAddress, fieldError } = this.state
    const submitData = cryptoAddress || uri
    if (fieldError) return
    this.props.bridge.resolve(submitData)
  }
  handleClose = () => this.props.bridge.resolve(null)
  keyExtractor = (item: string, index: number) => index.toString()
  render () {
    const copyMessage = this.state.clipboard ? sprintf(s.strings.string_paste_address, this.state.clipboard) : null
    const { uri, statusLabel, fieldError } = this.state
    return (
      <AirshipModal bridge={this.props.bridge} onCancel={this.handleClose}>
        {gap => (
          <Fragment>
            <IconCircle>
              <FontAwesomeIcon name={MODAL_ICON} size={iconStyles.size} color={iconStyles.color} />
            </IconCircle>
            <View style={styles.container}>
              <View style={styles.tileContainerHeader}>
                <Text style={dayText('title')}>{s.strings.scan_address_modal_header}</Text>
                <Text style={dayText('title')}>{s.strings.scan_address_modal_sub_header}</Text>
              </View>
              {copyMessage && (
                <View style={styles.tileContainerButtons}>
                  <TertiaryButton ellipsizeMode={'middle'} onPress={this.onPasteFromClipboard} numberOfLines={1} style={styles.addressModalButton}>
                    <TertiaryButton.Text>{copyMessage}</TertiaryButton.Text>
                  </TertiaryButton>
                </View>
              )}
              <View style={styles.tileContainerInput}>
                <InputAccessoryView nativeID={inputAccessoryViewID}>
                  <View style={styles.accessoryView}>
                    <TouchableOpacity style={styles.accessoryBtn} onPress={this.handleClose}>
                      <Text style={styles.accessoryText}>{s.strings.string_cancel_cap}</Text>
                    </TouchableOpacity>
                  </View>
                </InputAccessoryView>
                <FormField
                  autoFocus
                  blurOnSubmit
                  returnKeyType="done"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={addressInputStyles}
                  value={uri}
                  onChangeText={this.onChangeTextDelayed}
                  error={fieldError}
                  label={statusLabel}
                  onSubmitEditing={this.handleSubmit}
                  inputAccessoryViewID={inputAccessoryViewID}
                />
              </View>
              <FlatList
                style={{ flex: 1, marginBottom: -gap.bottom }}
                contentContainerStyle={{ paddingBottom: gap.bottom }}
                data={this.state.fioAddresses}
                initialNumToRender={24}
                keyboardShouldPersistTaps="handled"
                keyExtractor={this.keyExtractor}
                renderItem={this.renderFioAddressRow}
              />
            </View>
          </Fragment>
        )}
      </AirshipModal>
    )
  }
}
