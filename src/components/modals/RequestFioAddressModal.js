// @flow

import { FormField, InputAndButtonStyle, MaterialInputStyle, Modal, ModalStyle, PrimaryButton, SecondaryButton, TertiaryButton } from 'edge-components'
import type { EdgeCurrencyConfig } from 'edge-core-js'
import React, { Component } from 'react'
import { ActivityIndicator, Clipboard, Image, Text, View } from 'react-native'
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
  addressError: string,
  memo: string,
  memoError: string,
  addressFocus: boolean,
  memoFocus: boolean,
  addressValidationLoading: boolean
}
export class FioAddressModal extends Component<AddressModalProps, AddressModalState> {
  constructor (props: AddressModalProps) {
    super(props)
    this.state = {
      clipboard: '',
      address: '',
      addressError: '',
      memo: '',
      memoError: '',
      addressFocus: true,
      memoFocus: false,
      addressValidationLoading: false
    }
  }

  componentDidMount () {
    this._setClipboard()
  }

  _setClipboard = async () => {
    try {
      const address = await Clipboard.getString()
      const isFioAddress = await this.props.fioPlugin.otherMethods.isAccountAvailable(address)
      if (!isFioAddress) return

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

  onCancel = () => {
    this.props.onDone(null)
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
    let accountIsValid
    this.setState({
      addressValidationLoading: true
    })
    try {
      accountIsValid = await this.props.fioPlugin.otherMethods.isAccountAvailable(address)
    } catch (e) {
      accountIsValid = false
    }
    if (address && accountIsValid) {
      this.setState({
        addressError: '',
        addressFocus: false,
        memoFocus: true,
        addressValidationLoading: false
      })
      return true
    } else {
      this.setState({
        addressError: s.strings.fragment_send_send_to_fio_error_inline,
        addressFocus: true,
        memoFocus: false,
        addressValidationLoading: false
      })
      return false
    }
  }

  validateMemo = (): boolean => {
    const memo: string = this.state.memo
    if (!memo || (this.isASCII(memo) && memo.length <= 64)) {
      this.setState({
        memoError: ''
      })
      return true
    } else {
      this.setState({
        memoError: s.strings.fragment_send_send_to_fio_error_memo_inline
      })
      return false
    }
  }

  isASCII = (str: string) => {
    return /^[\x20-\x7E]*$/.test(str)
  }

  render () {
    const copyMessage = this.state.clipboard ? sprintf(s.strings.string_paste_address, this.state.clipboard) : null
    const { address, memo, addressError, memoError, addressFocus, memoFocus, addressValidationLoading } = this.state
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
                placeholder={s.strings.fio_address_confirm_screen_label}
                label={s.strings.fio_address_confirm_screen_label}
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
                label={s.strings.unique_identifier_memo}
                autoCapitalize="sentences"
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
              <SecondaryButton onPress={this.onCancel} style={[InputAndButtonStyle.noButton]}>
                <SecondaryButton.Text style={[InputAndButtonStyle.buttonText]}>{s.strings.string_cancel_cap}</SecondaryButton.Text>
              </SecondaryButton>
              <PrimaryButton onPress={this.onSubmit} disabled={addressValidationLoading} style={[InputAndButtonStyle.yesButton]}>
                {addressValidationLoading ? (
                  <ActivityIndicator size="small" />
                ) : (
                  <PrimaryButton.Text style={[InputAndButtonStyle.buttonText]}>{s.strings.string_done_cap}</PrimaryButton.Text>
                )}
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
