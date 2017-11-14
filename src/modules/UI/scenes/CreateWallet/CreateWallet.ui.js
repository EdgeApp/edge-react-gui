import React, {Component} from 'react'
import {Actions} from 'react-native-router-flux'
import {
  ActivityIndicator,
  Alert,
  View,
  Keyboard
} from 'react-native'
import {fixFiatCurrencyCode} from '../../../utils'
import {PrimaryButton, SecondaryButton} from '../../components/Buttons'
import DropdownPicker from '../../components/DropdownPicker/indexDropdownPicker'
import {FormField} from '../../../../components/FormField.js'

import styles from './styles.js'
import {MaterialInputOnWhite} from '../../../../styles/components/FormFieldStyles.js'
import strings from '../../../../locales/default'
import Gradient from '../../components/Gradient/Gradient.ui'

const WALLET_NAME_INPUT_PLACEHOLDER  = strings.enUS['fragment_wallets_addwallet_name_hint']
const WALLET_TYPE_PICKER_PLACEHOLDER = 'Choose a wallet type'
const FIAT_PICKER_PLACEHOLDER        = strings.enUS['fragment_wallets_addwallet_fiat_hint']

const DONE_TEXT         = strings.enUS['fragment_create_wallet_create_wallet']
const CANCEL_TEXT       = strings.enUS['string_cancel_cap']
const INVALID_DATA_TEXT = strings.enUS['fragment_create_wallet_select_valid']

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
    const isValidFiat       = !!this.isValidFiat()

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

  onSubmit = () => {
    if (!this.isValidData()) {
      Alert.alert(INVALID_DATA_TEXT)
    } else {
      this.setState({isCreatingWallet: true})
      Keyboard.dismiss()
      const {
        walletName,
        selectedWalletType,
        selectedFiat
      } = this.state
      this.props.createCurrencyWallet(
        walletName,
        selectedWalletType,
        fixFiatCurrencyCode(selectedFiat)
      )
    }
  }

  onCancel = () => {
    Keyboard.dismiss()
    Actions.pop() // redirect to the list of wallets
  }

  handleChangeWalletName = (walletName) => {
    this.setState({walletName})
  }

  handleSelectWalletType = ({value} = {value: ''}) => {
    const selectedWalletType = this.props.supportedWalletTypes.find((type) => type.value = value)
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

          <DropdownPicker
            keyboardShouldPersistTaps={'always'}
            listItems={this.props.supportedWalletTypes || []}
            placeholder={WALLET_TYPE_PICKER_PLACEHOLDER}
            onSelect={this.handleSelectWalletType} />

          <DropdownPicker
            keyboardShouldPersistTaps={'always'}
            listStyle={{maxHeight: 140}}
            listItems={this.getSupportedFiats()}
            placeholder={FIAT_PICKER_PLACEHOLDER}
            onSelect={this.handleSelectFiat} />

          <Buttons
            style={styles.buttons}
            isCreatingWallet={this.state.isCreatingWallet}
            onDone={this.onSubmit}
            onCancel={this.onCancel} />

        </View>
      </View>
    )
  }
}

// //////////////////////////// Buttons ////////////////////////////////////////

const Buttons = ({isCreatingWallet, onDone, onCancel}) => (
    <View style={styles.buttons}>

      <SecondaryButton
        style={[styles.cancel]}
        disabled={isCreatingWallet}
        onPressFunction={onCancel}
        text={CANCEL_TEXT} />

      <PrimaryButton
        style={[styles.submit]}
        disabled={isCreatingWallet}
        onPressFunction={onDone}
        text={DONE_TEXT}
        processingFlag={isCreatingWallet}
        processingElement={<ActivityIndicator />}
      />

    </View>
  )

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
