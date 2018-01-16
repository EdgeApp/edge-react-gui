// @flow

import React, {Component} from 'react'
import {Actions} from 'react-native-router-flux'
import {
  ActivityIndicator,
  Alert,
  View,
  Keyboard
} from 'react-native'
import SafeAreaView from '../../components/SafeAreaView'
import {SecondaryButton, PrimaryButton} from '../../components/Buttons'
import {FormField} from '../../../../components/FormField.js'

import styles from './style.js'
import {MaterialInputOnWhite} from '../../../../styles/components/FormFieldStyles.js'
import * as Constants from '../../../../constants/indexConstants'
import s from '../../../../locales/strings.js'
import Gradient from '../../components/Gradient/Gradient.ui'

export type CreateWalletNameProps = {

}

type State = {
  walletName: string
}

export class CreateWalletNameComponent extends Component<CreateWalletNameProps, State> {
  constructor (props: CreateWalletNameProps) {
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
      Actions[Constants.CREATE_WALLET_SELECT_CRYPTO]({walletName: this.state.walletName})
    } else {
      Alert.alert(s.strings.create_wallet_invalid_name, s.strings.create_wallet_enter_valid_name)
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
      <SafeAreaView>
        <View style={styles.scene}>
          <Gradient style={styles.gradient} />
          <View style={styles.view}>
            <WalletNameInput
              onChangeText={this.handleChangeWalletName}
              value={this.state.walletName}
              placeholder={s.strings.fragment_wallets_addwallet_name_hint}
            />
             <View style={styles.buttons}>
                <SecondaryButton
                  style={[styles.cancel]}
                  onPressFunction={this.onCancel}
                  text={s.strings.string_cancel_cap} />

                <PrimaryButton
                  style={[styles.next]}
                  onPressFunction={this.onNext}
                  text={s.strings.string_next_capitalized}
                  processingElement={<ActivityIndicator />}
                />
             </View>
          </View>
        </View>
      </SafeAreaView>
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
          placeholder={this.props.placeholder}
          onChangeText={this.props.onChangeText}
          label={s.strings.fragment_wallets_addwallet_name_hint}
          value={this.props.value}
        />
      </View>
    )
  }
}
