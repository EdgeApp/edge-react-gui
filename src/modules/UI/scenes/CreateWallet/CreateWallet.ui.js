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
const INVALID_DATA_TEXT = s.strings.fragment_create_wallet_select_valid
const NEXT_TEXT = s.strings.string_next_capitalized

export default class CreateWallet extends Component {
  constructor (props) {
    super(props)
    this.state = {
      supportedWalletTypes: props.supportedWalletTypes,
      isCreatingWallet: false,
      walletInfoValid: false,
      walletName: '',
      selectedWalletType: '',
      selectedFiat: ''
    }
  }

  getSupportedFiats = () => {
    const {supportedFiats} = this.props
    return supportedFiats
  }

  isValidData = () => {
    const isValidWalletName = !!this.isValidWalletName()
    const isValidWalletType = !!this.isValidWalletType()
    const isValidFiat = !!this.isValidFiat()

    return (isValidWalletName && isValidWalletType && isValidFiat)
  }

  isValidWalletName = () => {
    const {walletName} = this.state
    const isValid = walletName.length > 0

    return isValid
  }

  isValidWalletType = () => {
    const {supportedWalletTypes, selectedWalletType} = this.state
    const isValid = supportedWalletTypes
      .find((walletType) => walletType.value === selectedWalletType)

    return isValid
  }

  isValidFiat = () => {
    const supportedFiats = this.getSupportedFiats()
    const {selectedFiat} = this.state

    const isValid = supportedFiats
      .find((fiat) => fiat.value === selectedFiat)

    return isValid
  }

  onNext = () => {
    Actions.createWalletSelectCrypto({walletName: this.state.walletName})
  }

  onCancel = () => {
    Keyboard.dismiss()
    Actions.pop() // redirect to the list of wallets
  }

  handleChangeWalletName = (walletName) => {
    this.setState({walletName})
  }

  handleSelectWalletType = ({value} = {value: ''}) => {
    const selectedWalletType = this.props.supportedWalletTypes.find((type) => type.value === value)
    this.setState({selectedWalletType: selectedWalletType.value})
  }

  handleSelectFiat = ({value}) => {
    this.setState({selectedFiat: value})
  }

  render () {
    return (
      <View style={styles.scene}>
        <Gradient style={styles.gradient} />
        <View style={styles.view}>
          <WalletNameInput
            onChangeText={this.handleChangeWalletName}
            value={this.state.walletName}
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

class WalletNameInput extends Component {
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
