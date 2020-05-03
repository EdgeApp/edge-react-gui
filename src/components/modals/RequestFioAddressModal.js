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
  onDone: ({ fioAddress: string, memo: string } | null) => mixed,
  fioPlugin: EdgeCurrencyConfig,
  isConnected: boolean
}

type AddressModalState = {
  clipboard: string,
  address: string,
  addressError: string,
  memo: string,
  memoError: string,
  addressValidationLoading: boolean
}
export class FioAddressModal extends Component<AddressModalProps, AddressModalState> {
  fioCheckQueue: number = 0

  constructor (props: AddressModalProps) {
    super(props)
    this.state = {
      clipboard: '',
      address: '',
      addressError: '',
      memo: '',
      memoError: '',
      addressValidationLoading: false
    }
  }

  componentDidMount () {
    this._setClipboard()
  }

  _setClipboard = async () => {
    try {
      const address = await Clipboard.getString()
      const isFioAddress = await this.props.fioPlugin.otherMethods.isFioAddressValid(address)
      if (!isFioAddress) return

      this.setState({
        clipboard: address.toLowerCase()
      })
    } catch (e) {
      //
    }
  }

  updateAddress = (address: string) => {
    this.setState(
      {
        address: address.toLowerCase(),
        addressError: ''
      },
      this.validateAddressQueue
    )
  }

  updateMemo = (memo: string) => {
    this.setState(
      {
        memo
      },
      this.validateMemo
    )
  }

  onPasteFromClipboard = () => {
    const { clipboard } = this.state
    this.updateAddress(clipboard)
  }

  onCancel = () => {
    this.props.onDone(null)
  }

  onSubmit = async () => {
    const { memoError, address } = this.state
    if (!(await this.props.fioPlugin.otherMethods.isFioAddressValid(address))) {
      return this.setState({ addressError: s.strings.fio_error_invalid_address })
    }
    const doesExist = await this.doesAccountExist(address)
    if (doesExist && !memoError) {
      this.props.onDone({ fioAddress: this.state.address, memo: this.state.memo })
    }
  }

  validateAddressQueue = async (): Promise<void> => {
    const address: string = this.state.address
    if (!(await this.props.fioPlugin.otherMethods.isFioAddressValid(address))) return
    this.setState({
      addressValidationLoading: true
    })
    this.fioCheckQueue++
    setTimeout(async () => {
      // do not check if user continue typing fio address
      if (this.fioCheckQueue > 1) {
        return --this.fioCheckQueue
      }
      this.fioCheckQueue = 0
      this.doesAccountExist(address)
    }, 1000)
  }

  doesAccountExist = async (address: string): Promise<boolean> => {
    this.setState({
      addressError: '',
      addressValidationLoading: true
    })
    try {
      const doesAccountExist = await this.props.fioPlugin.otherMethods.doesAccountExist(address)

      this.setState({
        addressError: doesAccountExist ? '' : s.strings.send_fio_request_error_addr_not_exist,
        addressValidationLoading: false
      })
      return doesAccountExist
    } catch (e) {
      this.setState({
        addressError: s.strings.send_fio_request_error_addr_not_exist,
        addressValidationLoading: false
      })
      return false
    }
  }

  validateMemo = (): void => {
    const memo: string = this.state.memo
    let memoError = ''
    if (memo.length > 64) {
      memoError = s.strings.send_fio_request_error_memo_inline
    }
    if (memo && !this.isASCII(memo)) {
      memoError = s.strings.send_fio_request_error_memo_invalid_character
    }

    this.setState({
      memoError
    })
  }

  isASCII = (str: string) => {
    return /^[\x20-\x7E]*$/.test(str)
  }

  render () {
    const copyMessage = this.state.clipboard ? sprintf(s.strings.string_paste_address, this.state.clipboard) : null
    const { address, memo, addressError, memoError, addressValidationLoading } = this.state
    const submitDisabled = addressValidationLoading || !!addressError || !!memoError
    return (
      <View style={ModalStyle.modal}>
        <Modal.Icon>
          <Image style={styles.transactionLogo} source={fioRequestsIcon} />
        </Modal.Icon>
        <Modal.Container>
          <Modal.Icon.AndroidHackSpacer />
          <Modal.Title style={styles.title}>
            <Text>{s.strings.send_fio_request_dialog_title}</Text>
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
                autoFocus={true}
              />
              <FormField
                style={MaterialInputStyle}
                value={memo}
                onChangeText={this.updateMemo}
                error={memoError}
                placeholder={s.strings.unique_identifier_memo}
                label={s.strings.unique_identifier_memo}
                autoCapitalize="sentences"
                onSubmitEditing={this.validateMemo}
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
              <PrimaryButton onPress={this.onSubmit} disabled={submitDisabled} style={[InputAndButtonStyle.yesButton]}>
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
  function FioAddressModalWrapped (props: { +onDone: ({ fioAddress: string, memo: string } | null) => mixed }) {
    return <FioAddressModal {...opts} {...props} />
  }
  return FioAddressModalWrapped
}
