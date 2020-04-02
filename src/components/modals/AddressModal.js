// @flow

import { FormField, InputAndButtonStyle, MaterialInputStyle, Modal, ModalStyle, PrimaryButton, SecondaryButton, TertiaryButton } from 'edge-components'
import type { EdgeCurrencyWallet } from 'edge-core-js'
import React, { Component } from 'react'
import { Clipboard, Text, View } from 'react-native'
import FAIcon from 'react-native-vector-icons/FontAwesome'
import { sprintf } from 'sprintf-js'

import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings.js'
import styles from '../../styles/scenes/ScaneStyle'
import { colors as COLORS } from '../../theme/variables/airbitz.js'
import ResolutionError, { ResolutionErrorCode } from '../common/ResolutionError.js'

// INTERACTIVE_MODAL /////////////////////////////////////////////////////////////////////////////
type AddressModalProps = {
  onDone: any => void,
  coreWallet: EdgeCurrencyWallet,
  currencyCode: string
}

type AddressModalState = {
  clipboard: string,
  uri: string,
  statusLabel: string,
  cryptoAddress?: string
}
export class AddressModal extends Component<AddressModalProps, AddressModalState> {
  /* static Icon = Icon
  static Title = Title
  static Description = Description
  static Body = Body
  static Footer = Footer
  static Item = Item
  static Row = Row */

  constructor (props: AddressModalProps) {
    super(props)
    this.state = {
      clipboard: '',
      uri: '',
      statusLabel: s.strings.fragment_send_send_to_hint,
      cryptoAddress: undefined
    }
  }

  componentDidMount () {
    this._setClipboard(this.props)
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
    this.updateUri(domain)
  }

  checkIfDomain = (domain: string): boolean => {
    return domain.endsWith('.zil') || domain.endsWith('.crypto') || domain.endsWith('.eth')
  }

  fetchDomain = async (domain: string, currencyTicker: string) => {
    domain = domain.trim().toLowerCase();
    if (!this.checkIfDomain(domain)) {
      throw new ResolutionError(ResolutionErrorCode.UnsupportedDomain, { domain })
    }
    const baseurl = `https://unstoppabledomains.com/api/v1`
    const url = `${baseurl}/${domain}`
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
    try {
      this.setStatusLabel(s.strings.resolving)
      const addr = await this.fetchDomain(domain, currencyTicker)
      this.setStatusLabel(addr)
      this.setCryptoAddress(addr)
    } catch (err) {
      if (err instanceof ResolutionError) {
        const message = sprintf(s.strings[err.code], domain, currencyTicker)
        if (domain === '') this.setStatusLabel(s.strings.fragment_send_send_to_hint)
        else {
          this.setStatusLabel(message)
          this.setCryptoAddress(undefined)
        }
      }
    }
  }

  updateUri = (uri: string) => {
    this.setState({
      uri
    })
  }

  onPasteFromClipboard = () => {
    const { clipboard } = this.state
    this.props.onDone(clipboard)
  }

  handleSubmit = () => {
    const { uri, cryptoAddress } = this.state
    const submitData = cryptoAddress || uri
    console.log(`submiting ${submitData}`)
    this.props.onDone(submitData)
  }

  render () {
    const copyMessage = this.state.clipboard ? sprintf(s.strings.string_paste_address, this.state.clipboard) : null
    const { uri, statusLabel } = this.state
    return (
      <View style={ModalStyle.modal}>
        <Modal.Icon>
          <FAIcon name={Constants.ADDRESS_BOOK_O} size={24} color={COLORS.primary} />
        </Modal.Icon>
        <Modal.Container>
          <Modal.Icon.AndroidHackSpacer />
          <Modal.Title style={{ textAlign: 'center' }}>
            <Text>{s.strings.fragment_send_address_dialog_title}</Text>
          </Modal.Title>
          <Modal.Body>
            <View>
              <FormField
                style={MaterialInputStyle}
                value={uri}
                onChangeText={this.onChangeTextDelayed}
                error={''}
                placeholder={s.strings.fragment_send_send_to_hint}
                label={statusLabel}
                onSubmit={this.handleSubmit}
              />
            </View>
          </Modal.Body>
          <Modal.Footer>
            {copyMessage && (
              <Modal.Row style={InputAndButtonStyle.tertiaryButtonRow}>
                <TertiaryButton ellipsizeMode={'middle'} onPress={this.onPasteFromClipboard} numberOfLines={1} style={styles.addressModalButton}>
                  <TertiaryButton.Text>{copyMessage}</TertiaryButton.Text>
                </TertiaryButton>
              </Modal.Row>
            )}
            <Modal.Row style={[InputAndButtonStyle.row]}>
              <SecondaryButton onPress={() => this.props.onDone(null)} style={[InputAndButtonStyle.noButton]}>
                <SecondaryButton.Text style={[InputAndButtonStyle.buttonText]}>{s.strings.string_cancel_cap}</SecondaryButton.Text>
              </SecondaryButton>
              <PrimaryButton onPress={this.handleSubmit} style={[InputAndButtonStyle.yesButton]}>
                <PrimaryButton.Text style={[InputAndButtonStyle.buttonText]}>{s.strings.string_done_cap}</PrimaryButton.Text>
              </PrimaryButton>
            </Modal.Row>
          </Modal.Footer>
        </Modal.Container>
      </View>
    )
  }
}

export type AddressModalOpts = {
  walletId: string,
  coreWallet: EdgeCurrencyWallet,
  currencyCode: string
}

export const createAddressModal = (opts: AddressModalOpts) => {
  function AddressModalWrapped (props: { +onDone: Function }) {
    return <AddressModal {...opts} {...props} />
  }
  return AddressModalWrapped
}
