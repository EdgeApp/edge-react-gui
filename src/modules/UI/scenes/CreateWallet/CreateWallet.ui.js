import React, {Component} from 'react'
import {Actions} from 'react-native-router-flux'
import {
  ActivityIndicator,
  Alert,
  View,
  Keyboard,
  ListView,
  TouchableOpacity,
  TextInput
} from 'react-native'
import T from '../../components/FormattedText'
import {PrimaryButton, SecondaryButton} from '../../components/Buttons'
import styles from './styles.js'
import strings from '../../../../locales/default'
import {sprintf} from 'sprintf-js'

const WALLET_NAME_INPUT_PLACEHOLDER = sprintf(strings.enUS['fragment_wallets_addwallet_name_hint'])
const WALLET_TYPE_PICKER_PLACEHOLDER = 'Choose a wallet type'
const FIAT_PICKER_PLACEHOLDER = sprintf(strings.enUS['fragment_wallets_addwallet_fiat_hint'])

const DONE_TEXT = sprintf(strings.enUS['fragment_create_wallet_create_wallet'])
const CANCEL_TEXT = sprintf(strings.enUS['string_cancel_cap'])
const INVALID_DATA_TEXT = sprintf(strings.enUS['fragment_create_wallet_select_valid'])

// //////////////////////////// ROOT ///////////////////////////////////////////

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
    const supportedFiats = [
      {label: sprintf(strings.enUS['fragment_fiat_usd']), value: sprintf(strings.enUS['fragment_fiat_usd'])},
      {label: sprintf(strings.enUS['fragment_fiat_eur']), value: sprintf(strings.enUS['fragment_fiat_eur'])},
      {label: sprintf(strings.enUS['fragment_fiat_gbp']), value: sprintf(strings.enUS['fragment_fiat_gbp'])},
      {label: sprintf(strings.enUS['fragment_fiat_jpy']), value: sprintf(strings.enUS['fragment_fiat_jpy'])},
      {label: sprintf(strings.enUS['fragment_fiat_cnh']), value: sprintf(strings.enUS['fragment_fiat_cnh'])},
      {label: sprintf(strings.enUS['fragment_fiat_mxp']), value: sprintf(strings.enUS['fragment_fiat_mxp'])}
    ]

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

  onSubmit = () => {
    if (!this.isValidData()) {
      Alert.alert(INVALID_DATA_TEXT)
    } else {
      this.setState({isCreatingWallet: true})
      Keyboard.dismiss()
      const {walletName, selectedWalletType} = this.state
      // console.log('walletName', walletName)
      // console.log('selectedWalletType', selectedWalletType)
      this.props.createWallet(walletName, selectedWalletType)
    }
  }

  onCancel = () => {
    Keyboard.dismiss()
    Actions.walletList() // redirect to the list of wallets
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
      <View style={styles.view}>

        <WalletNameInput
          placeholder={WALLET_NAME_INPUT_PLACEHOLDER}
          onChangeText={this.handleChangeWalletName} />

        <DropdownPicker
          keyboardShouldPersistTaps={'always'}
          listItems={this.props.supportedWalletTypes || []}
          placeholder={WALLET_TYPE_PICKER_PLACEHOLDER}
          onSelect={this.handleSelectWalletType} />

        <DropdownPicker
          keyboardShouldPersistTaps={'always'}
          listItems={this.getSupportedFiats()}
          placeholder={FIAT_PICKER_PLACEHOLDER}
          onSelect={this.handleSelectFiat} />

        <Buttons
          style={styles.buttons}
          isCreatingWallet={this.state.isCreatingWallet}
          onDone={this.onSubmit}
          onCancel={this.onCancel} />

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
        <TextInput style={styles.picker}
          clearButtonMode={'while-editing'}
          autoCorrect={false}
          autoFocus
          placeholder={this.props.placeholder}
          onChangeText={this.props.onChangeText} />
      </View>
    )
  }
}

// //////////////////////////// DropDownPicker /////////////////////////////////

class DropdownPicker extends Component {
  constructor (props) {
    super(props)

    this.state = {
      searchTerm: '',
      isListVisible: false,
      selectedItem: ''
    }
  }

  handleTextInputChange = (searchTerm) => {
    this.handleSelectListItem(searchTerm)
    this.handleSearchTermChange(searchTerm)
  }
  handleSelectListItem = (item) => {
    this.setState({searchTerm: item.label, isListVisible: false})
    this.props.onSelect(item)
  }
  handleSearchTermChange = (searchTerm) => this.setState({isListVisible: true, searchTerm})
  handleOnFocus = () => this.setState({isListVisible: true})
  handleOnBlur = () => this.setState({isListVisible: false})

  getMatchingListItems = () => {
    const {searchTerm} = this.state
    const normalizedSearchTerm = searchTerm.toLowerCase()
    return this.props.listItems.filter((listItem) =>
      listItem.label
      .toLowerCase()
      .includes(normalizedSearchTerm))
  }

  render () {
    return (
      <View style={styles.pickerView}>
        <TextInput style={styles.picker}
          clearButtonMode={'while-editing'}
          onFocus={this.handleOnFocus}
          onBlur={this.handleOnBlur}
          autoCorrect={false}
          autoCapitalize={'words'}
          onChangeText={this.handleTextInputChange}
          value={this.state.searchTerm}
          placeholder={this.props.placeholder} />

          {this.state.isListVisible
            && <DropdownList
              dataSource={this.getMatchingListItems()}
              onPress={this.handleSelectListItem} />}
      </View>
    )
  }
}

// //////////////////////////// DropdownList ///////////////////////////////////

const DropdownList = (props) => {
  const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2})
  const dataSource = ds.cloneWithRows(props.dataSource)
  const onPress = (item) => () => props.onPress(item)
  const renderRow = (item) => <TouchableOpacity
    style={{backgroundColor: 'white', padding: 10}}
    onPress={onPress(item)}>
    <T>{item.label}</T>
  </TouchableOpacity>

  return <View style={styles.listView}>
    <ListView
      keyboardShouldPersistTaps={'always'}
      style={styles.listView}
      dataSource={dataSource}
      renderRow={renderRow} />
  </View>
}

// //////////////////////////// End ////////////////////////////////////////////
