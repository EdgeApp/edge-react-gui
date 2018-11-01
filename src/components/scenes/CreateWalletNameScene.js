// @flow

import React, { Component } from 'react'
import { Alert, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { sprintf } from 'sprintf-js'

import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings.js'
import { PrimaryButton, SecondaryButton } from '../../modules/UI/components/Buttons/index'
import Gradient from '../../modules/UI/components/Gradient/Gradient.ui'
import SafeAreaView from '../../modules/UI/components/SafeAreaView/index'
import { MaterialInputOnWhite } from '../../styles/components/FormFieldStyles.js'
import styles from '../../styles/scenes/CreateWalletStyle.js'
import type { GuiFiatType, GuiWalletType } from '../../types.js'
import { FormField } from '../common/FormField.js'

export type CreateWalletNameOwnProps = {
  selectedFiat: GuiFiatType,
  selectedWalletType: GuiWalletType
}
type Props = CreateWalletNameOwnProps
type State = {
  walletName: string
}

export class CreateWalletName extends Component<Props, State> {
  constructor (props: Props) {
    super(props)
    let walletName = ''
    // XXX Hack for Ripple
    if (this.props.selectedWalletType.currencyCode.toLowerCase() === 'xrp') {
      walletName = sprintf(s.strings.my_crypto_wallet_name, 'XRP')
    } else {
      walletName = sprintf(s.strings.my_crypto_wallet_name, this.props.selectedWalletType.label)
    }
    this.state = { walletName }
  }

  isValidWalletName = () => {
    const { walletName } = this.state
    const isValid = walletName.length > 0

    return isValid
  }

  onNext = () => {
    if (this.isValidWalletName()) {
      Actions[Constants.CREATE_WALLET_REVIEW]({
        walletName: this.state.walletName,
        selectedFiat: this.props.selectedFiat,
        selectedWalletType: this.props.selectedWalletType
      })
    } else {
      Alert.alert(s.strings.create_wallet_invalid_name, s.strings.create_wallet_enter_valid_name)
    }
  }

  onBack = () => {
    Actions.pop()
  }

  handleChangeWalletName = (walletName: string) => {
    this.setState({ walletName })
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
              onNext={this.onNext}
            />
            <View style={styles.buttons}>
              <SecondaryButton style={[styles.back]} onPress={this.onBack}>
                <SecondaryButton.Text>{s.strings.title_back}</SecondaryButton.Text>
              </SecondaryButton>

              <PrimaryButton style={[styles.next]} onPress={this.onNext}>
                <PrimaryButton.Text>{s.strings.string_next_capitalized}</PrimaryButton.Text>
              </PrimaryButton>
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
  onChangeText: (walletName: string) => void,
  onNext: () => void
}

class WalletNameInput extends Component<WalletNameInputProps> {
  render () {
    return (
      <View style={styles.pickerView}>
        <FormField
          style={MaterialInputOnWhite}
          autoFocus
          clearButtonMode={'while-editing'}
          autoCorrect={false}
          placeholder={this.props.placeholder}
          onChangeText={this.props.onChangeText}
          label={s.strings.fragment_wallets_addwallet_name_hint}
          value={this.props.value}
          returnKeyType={'next'}
          onSubmitEditing={this.props.onNext}
        />
      </View>
    )
  }
}
