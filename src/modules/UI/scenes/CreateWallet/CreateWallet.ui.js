// @flow

import React, {Component} from 'react'
import {Actions} from 'react-native-router-flux'
import {
  ActivityIndicator,
  Alert,
  View,
  Keyboard
} from 'react-native'
import {SecondaryButton, TertiaryButton} from '../../components/Buttons'
import {FormField} from '../../../../components/FormField.js'

import styles from './style.js'
import {MaterialInputOnWhite} from '../../../../styles/components/FormFieldStyles.js'
import s from '../../../../locales/strings.js'
import Gradient from '../../components/Gradient/Gradient.ui'

const WALLET_NAME_INPUT_PLACEHOLDER = s.strings.fragment_wallets_addwallet_name_hint
const CANCEL_TEXT = s.strings.string_cancel_cap
const WALLET_NAME_INVALID_TEXT = s.strings.create_wallet_invalid_name
const WALLET_NAME_E_ENTER_VALID_TEXT = s.strings.create_wallet_enter_valid_name
const INVALID_DATA_TEXT = s.strings.fragment_create_wallet_select_valid
const NEXT_TEXT = s.strings.string_next_capitalized

export type Props = {

}

export type State = {
  walletName: string
}

export default class CreateWallet extends Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {
      walletName: ''
    }
  }

  isValidWalletName = (): boolean => {
    const {walletName} = this.state
    const isValid: boolean = walletName.length > 0

    return isValid
  }

  onNext = (): void => {
    if (this.isValidWalletName()) {
      Actions.createWalletSelectCrypto({walletName: this.state.walletName})
    } else {
      Alert.alert(WALLET_NAME_INVALID_TEXT, WALLET_NAME_E_ENTER_VALID_TEXT)
    }
  }

  onCancel = (): void => {
    Keyboard.dismiss()
    Actions.pop() // redirect to the list of wallets
  }

  handleChangeWalletName = (walletName: string) => {
    this.setState({walletName})
  }

  render () {
    return (
      <View style={styles.scene}>
        <Gradient style={styles.gradient} />
        <View style={styles.view}>
          <WalletNameInput
            onChangeText={this.handleChangeWalletName}
            value={this.state.walletName}
            placeholder={WALLET_NAME_INPUT_PLACEHOLDER}
          />
         <View style={styles.buttons}>
            <SecondaryButton
              style={[styles.cancel]}
              onPressFunction={this.onCancel}
              text={CANCEL_TEXT} />

            <TertiaryButton
              style={[styles.next]}
              disabled={!this.state.walletName}
              onPressFunction={this.onNext}
              text={NEXT_TEXT}
              processingElement={<ActivityIndicator />}
            />
          </View>
        </View>
      </View>
    )
  }
}

// //////////////////////////// WalletNameInput /////////////////////////////////

export type WalletNameInputProps = {
  value: string,
  placeholder: string,
  onChangeText: Function
}

class WalletNameInput extends Component<WalletNameInputProps> {
  render () {
    return (
      <View style={styles.pickerView}>
        <FormField style={MaterialInputOnWhite}
          clearButtonMode={'while-editing'}
          autoCorrect={false}
          autoFocus
          placeholder={this.props.placeholder}
          onChangeText={this.props.onChangeText}
          label={WALLET_NAME_INPUT_PLACEHOLDER}
          value={this.props.value}
        />
      </View>
    )
  }
}
