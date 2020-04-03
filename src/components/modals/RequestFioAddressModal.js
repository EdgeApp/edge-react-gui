// @flow

import { FormField, InputAndButtonStyle, MaterialInputStyle, Modal, ModalStyle, PrimaryButton, SecondaryButton, TertiaryButton } from 'edge-components'
import type { EdgeCurrencyConfig } from 'edge-core-js'
import React, { Component } from 'react'
import { Clipboard, Image, Text, View } from 'react-native'
import { sprintf } from 'sprintf-js'

import fioRequestsIcon from '../../assets/images/fio/SendModule_FioAddress.png'
import s from '../../locales/strings.js'
import styles from '../../styles/scenes/ScaneStyle'

type AddressModalProps = {
  onDone: any => void,
  fioPlugin: EdgeCurrencyConfig,
  isConnected: boolean
}

type AddressModalState = {
  clipboard: string,
  address: string,
  addressLabel: string,
  addressError: string,
  memo: string,
  memoLabel: string,
  memoError: string,
  addressFocus: boolean,
  memoFocus: boolean
}
export class FioAddressModal extends Component<AddressModalProps, AddressModalState> {
  constructor (props: AddressModalProps) {
    super(props)
    this.state = {
      clipboard: '',
      address: '',
      addressLabel: s.strings.fio_address_label,
      addressError: '',
      memo: '',
      memoLabel: s.strings.unique_identifier_memo,
      memoError: '',
      addressFocus: true,
      memoFocus: false
    }
  }

  componentDidMount () {
    this._setClipboard()
  }

  _setClipboard = async () => {
    try {
      const address = await Clipboard.getString()

      this.setState({
        clipboard: address
      })
    } catch (e) {
      // todo: handle error
    }
  }

  updateAddress = (address: string) => {
    this.setState({
      address
    })
  }

  updateMemo = (memo: string) => {
    this.setState({
      memo
    })
  }

  onPasteFromClipboard = () => {
    const { clipboard } = this.state
    this.updateAddress(clipboard)
  }

  onSubmit = async () => {
    const validAddress = await this.validateAddress()
    const validMemo = this.validateMemo()
    if (validAddress && validMemo) {
      this.props.onDone({ fioAddress: this.state.address, memo: this.state.memo })
    }
  }

  onValidateAddress = (): void => {
    this.validateAddress()
  }

  onValidateMemo = (): void => {
    this.validateMemo()
  }

  validateAddress = async (): Promise<boolean> => {
    const address: string = this.state.address
    if (address && (await this.props.fioPlugin.otherMethods.isAccountAvailable(address))) {
      this.setState({
        addressError: '',
        addressLabel: s.strings.fio_address_label,
        addressFocus: false,
        memoFocus: true
      })
      return true
    } else {
      this.setState({
        addressError: s.strings.fragment_send_send_to_fio_error_inline,
        addressLabel: s.strings.fragment_send_send_to_fio_error,
        addressFocus: true,
        memoFocus: false
      })
      return false
    }
  }

  validateMemo = (): boolean => {
    const memo: string = this.state.memo
    if (!memo || (this.isASCII(memo) && memo.length <= 64)) {
      this.setState({
        memoError: '',
        memoLabel: s.strings.unique_identifier_memo
      })
      return true
    } else {
      this.setState({
        memoError: s.strings.fragment_send_send_to_fio_error_memo_inline,
        memoLabel: s.strings.fragment_send_send_to_fio_memo_error
      })
      return false
    }
  }

  isASCII = (str: string) => {
    return /^[\x20-\x7E]*$/.test(str)
  }

  render () {
    const copyMessage = this.state.clipboard ? sprintf(s.strings.string_paste_address, this.state.clipboard) : null
    const { address, memo, addressError, addressLabel, memoError, memoLabel, addressFocus, memoFocus } = this.state
    return (
      <View style={ModalStyle.modal}>
        <Modal.Icon>
          <Image style={styles.transactionLogo} source={fioRequestsIcon} />
        </Modal.Icon>
        <Modal.Container>
          <Modal.Icon.AndroidHackSpacer />
          <Modal.Title style={{ textAlign: 'center' }}>
            <Text>{s.strings.fragment_send_fio_address_dialog_title}</Text>
          </Modal.Title>
          <Modal.Body>
            <View>
              <FormField
                style={MaterialInputStyle}
                value={address}
                onChangeText={this.updateAddress}
                error={addressError}
                placeholder={s.strings.fio_address_label}
                label={addressLabel}
                autoFocus={addressFocus}
                onBlur={this.onValidateAddress}
                onSubmitEditing={this.onValidateAddress}
              />
              <FormField
                style={MaterialInputStyle}
                value={memo}
                onChangeText={this.updateMemo}
                error={memoError}
                placeholder={s.strings.unique_identifier_memo}
                label={memoLabel}
                autoFocus={memoFocus}
                onBlur={this.onValidateMemo}
                onSubmitEditing={this.onValidateMemo}
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
              <PrimaryButton onPress={() => this.onSubmit()} style={[InputAndButtonStyle.yesButton]}>
                <PrimaryButton.Text style={[InputAndButtonStyle.buttonText]}>{s.strings.string_done_cap}</PrimaryButton.Text>
              </PrimaryButton>
            </Modal.Row>
          </Modal.Footer>
        </Modal.Container>
      </View>
    )
  }
}

export type FioAddressModalOpts = { fioPlugin: EdgeCurrencyConfig, isConnected: boolean }

export const createFioAddressModal = (opts: FioAddressModalOpts) => {
  function FioAddressModalWrapped (props: { +onDone: Function }) {
    return <FioAddressModal {...opts} {...props} />
  }
  return FioAddressModalWrapped
}
