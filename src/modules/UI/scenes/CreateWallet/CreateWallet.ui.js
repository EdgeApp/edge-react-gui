import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Actions } from 'react-native-router-flux'
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

import * as SETTINGS_SELECTORS from '../../Settings/selectors.js'

import { updateWalletName, selectWalletType, selectFiat, createWallet } from './action'

// import { MKTextField as TextInput } from 'react-native-material-kit'

const WALLET_NAME_INPUT_PLACEHOLDER = sprintf(strings.enUS['fragment_wallets_addwallet_name_hint'])
const WALLET_TYPE_PICKER_PLACEHOLDER = 'Choose a wallet type' // sprintf(strings.enUS['fragment_wallets_addwallet_blockchain_hint'])
const FIAT_PICKER_PLACEHOLDER = sprintf(strings.enUS['fragment_wallets_addwallet_fiat_hint'])

const DONE_TEXT = sprintf(strings.enUS['fragment_create_wallet_create_wallet'])
const CANCEL_TEXT = sprintf(strings.enUS['string_cancel_cap'])
const INVALID_DATA_TEXT = sprintf(strings.enUS['fragment_create_wallet_select_valid'])

// //////////////////////////// ROOT ///////////////////////////////////////////

class CreateWallet extends Component {
  constructor (props) {
    super(props)
    this.state = {
      isCreatingWallet: false,
      walletInfoValid: false
    }
  }

  getSupportedWalletTypes = () => {
    return Object.keys(this.props.supportedWalletTypes)
  }

  getSupportedFiats = () => {
    const supportedFiats = [
      sprintf(strings.enUS['fragment_fiat_usd']),
      sprintf(strings.enUS['fragment_fiat_eur']),
      sprintf(strings.enUS['fragment_fiat_gbp']),
      sprintf(strings.enUS['fragment_fiat_jpy']),
      sprintf(strings.enUS['fragment_fiat_cnh']),
      sprintf(strings.enUS['fragment_fiat_mxp'])
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
    const isValid = this.props.walletName

    return isValid
  }

  isValidWalletType = () => {
    const { supportedWalletTypes, selectedWalletType } = this.props

    const isValid = Object.values(supportedWalletTypes).find((walletType) => {
      return walletType === selectedWalletType
    })

    return isValid
  }

  isValidFiat = () => {
    const supportedFiats = this.getSupportedFiats()
    const { selectedFiat } = this.props

    const isValid = supportedFiats.find((fiat) => {
      return fiat === selectedFiat
    })

    return isValid
  }

  onSubmit = () => {
    if (!this.isValidData()) {
      Alert.alert(INVALID_DATA_TEXT)
    } else {
      this.setState({ isCreatingWallet: true })
      Keyboard.dismiss()
      const { walletName, selectedWalletType } = this.props
      console.log('walletName', walletName)
      console.log('selectedWalletType', selectedWalletType)
      this.props.createWallet(walletName, selectedWalletType)
    }
  }

  onCancel = () => {
    Keyboard.dismiss()
    Actions.walletList() // redirect to the list of wallets
  }

  handleChangeWalletName = input => {
    this.props.updateWalletName(input)
  }

  handleSelectWalletType = currencyName => {
    const walletType = this.props.supportedWalletTypes[currencyName] || ''
    this.props.selectWalletType(walletType)
  }

  handleSelectFiat = fiat => {
    this.props.selectFiat(fiat)
  }

  render () {
    return (
      <View style={styles.view}>

        <WalletNameInput
          placeholder={WALLET_NAME_INPUT_PLACEHOLDER}
          onChangeText={this.handleChangeWalletName} />

        <DropdownPicker
          keyboardShouldPersistTaps={'always'}
          listItems={this.getSupportedWalletTypes()}
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

const mapStateToProps = (state) => ({
  walletName: state.ui.scenes.createWallet.walletName,
  selectedWalletType: state.ui.scenes.createWallet.selectedWalletType,
  selectedFiat: state.ui.scenes.createWallet.selectedFiat,
  supportedWalletTypes: SETTINGS_SELECTORS.getSupportedWalletTypes(state)
})

const mapDispatchToProps = (dispatch) => ({
  updateWalletName: walletName => dispatch(updateWalletName(walletName)),
  selectWalletType: walletType => dispatch(selectWalletType(walletType)),
  selectFiat: fiat => dispatch(selectFiat(fiat)),
  createWallet: (walletName, walletType) => dispatch(createWallet(walletName, walletType))
})

export default connect(mapStateToProps, mapDispatchToProps)(CreateWallet)

// //////////////////////////// Buttons ////////////////////////////////////////

const Buttons = ({isCreatingWallet, onDone, onCancel}) => {
  return (
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
}

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

  handleSearchTermChange = (searchTerm) => {
    this.setState({
      isListVisible: true,
      searchTerm
    })
  }

  handleOnFocus = () => {
    this.setState({
      isListVisible: true
    })
  }

  handleOnBlur = () => {
    this.setState({
      isListVisible: false
    })
  }

  handleSelectListItem = (listItem) => {
    this.setState({
      searchTerm: listItem,
      isListVisible: false
    })

    this.props.onSelect(listItem)
  }

  getMatchingListItems = () => {
    const { searchTerm } = this.state
    const normalizedSearchTerm = searchTerm.toLowerCase()
    const matchingListItems = this.props.listItems.filter((listItem) => {
      const normalizedListItem = listItem.toLowerCase()

      return normalizedListItem.includes(normalizedSearchTerm)
    })

    return matchingListItems
  }

  displayListIfVisible = () => {
    const {isListVisible} = this.state

    if (isListVisible) {
      return (
        <DropdownList
          dataSource={this.getMatchingListItems()}
          onPress={this.handleSelectListItem} />
      )
    }
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

        {this.displayListIfVisible()}
      </View>
    )
  }
}

// //////////////////////////// DropdownList ///////////////////////////////////

const DropdownList = props => {
  const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2})
  const dataSource = ds.cloneWithRows(props.dataSource)

  const renderRow = (data) => {
    return (
      <TouchableOpacity
        style={{ backgroundColor: 'white', padding: 10 }}
        onPress={() => props.onPress(data)}>
        <T>{data}</T>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.listView}>
      <ListView
        keyboardShouldPersistTaps={'always'}
        style={styles.listView}
        dataSource={dataSource}
        renderRow={renderRow} />
    </View>
  )
}

// //////////////////////////// End ////////////////////////////////////////////
