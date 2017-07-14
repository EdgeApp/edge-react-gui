import React, { Component } from 'react'
import strings from '../../../../locales/default'
import {sprintf} from 'sprintf-js'
import {
  ScrollView,
  Text,
  View,
  StyleSheet,
  Keyboard,
  ListView,
  Button,
  TouchableOpacity,
  TextInput } from 'react-native'
import T from '../../components/FormattedText'
import { connect } from 'react-redux'
import styles from './styles.js'
import { dev } from '../../../utils.js'
import { updateWalletName, selectBlockchain, selectFiat, createWallet } from './action'
import LinearGradient from 'react-native-linear-gradient'

import { addWallet } from '../../Wallets/action.js'
import { Actions } from 'react-native-router-flux'

// import { MKTextField as TextInput } from 'react-native-material-kit'

const WALLET_NAME_INPUT_PLACEHOLDER = sprintf(strings.enUS['fragment_wallets_addwallet_name_hint'])
const BLOCKCHAIN_PICKER_PLACEHOLDER = sprintf(strings.enUS['fragment_wallets_addwallet_blockchain_hint'])
const FIAT_PICKER_PLACEHOLDER       = sprintf(strings.enUS['fragment_wallets_addwallet_fiat_hint'])

const DONE_TEXT         = sprintf(strings.enUS['fragment_create_wallet_create_wallet'])
const CANCEL_TEXT       = sprintf(strings.enUS['string_cancel_cap'])
const INVALID_DATA_TEXT = sprintf(strings.enUS['fragment_create_wallet_select_valid'])

////////////////////////////// ROOT ///////////////////////////////////////////

class CreateWallet extends Component {
  getSupportedBlockchains = () => {
    const supportedBlockchains = [
      // sprintf(strings.enUS['fragment_blockchain_btc']),
      sprintf(strings.enUS['fragment_blockchain_eth']),
      'Shitcoin'
    ]

    return supportedBlockchains
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
    const isValidBlockchain = !!this.isValidBlockchain()
    const isValidFiat = !!this.isValidFiat()

    return (isValidWalletName && isValidBlockchain && isValidFiat)
  }

  isValidWalletName = () => {
    const isValid = this.props.walletName

    return isValid
  }

  isValidBlockchain = () => {
    const supportedBlockchains = this.getSupportedBlockchains()
    const { selectedBlockchain } = this.props

    const isValid = supportedBlockchains.find((blockchain) => {
      return blockchain === selectedBlockchain
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

  handleOnDone = () => {
    if (!this.isValidData()) {
      alert(INVALID_DATA_TEXT)
    } else {
      Keyboard.dismiss()
      const { walletName, selectedBlockchain } = this.props
      console.log('walletName', walletName)
      console.log('selectedBlockchain', selectedBlockchain)
      this.props.createWallet(walletName, selectedBlockchain)
    }
  }

  handleOnCancel = () => {
    Keyboard.dismiss()
    Actions.walletList() //redirect to the list of wallets
  }

  handleChangeWalletName = input => {
    this.props.updateWalletName(input)
  }

  handleSelectBlockchain = blockchain => {
    this.props.selectBlockchain(blockchain)
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
          listItems={this.getSupportedBlockchains()}
          placeholder={BLOCKCHAIN_PICKER_PLACEHOLDER}
          onSelect={this.handleSelectBlockchain} />

        <DropdownPicker
          keyboardShouldPersistTaps={'always'}
          listItems={this.getSupportedFiats()}
          placeholder={FIAT_PICKER_PLACEHOLDER}
          onSelect={this.handleSelectFiat} />

        <Buttons
          style={styles.buttons}
          onDone={this.handleOnDone}
          onCancel={this.handleOnCancel} />

      </View>
    )
  }
}

const mapStateToProps = state => ({
  walletName: state.ui.scenes.createWallet.walletName,
  selectedBlockchain: state.ui.scenes.createWallet.selectedBlockchain,
  selectedFiat: state.ui.scenes.createWallet.selectedFiat
})

const mapDispatchToProps = dispatch => ({
  updateWalletName: walletName => dispatch(updateWalletName(walletName)),
  selectBlockchain: blockchain => dispatch(selectBlockchain(blockchain)),
  selectFiat:       fiat       => dispatch(selectFiat(fiat)),
  createWallet:     (walletName, blockchain) => dispatch(createWallet(walletName, blockchain))
})

export default connect(mapStateToProps, mapDispatchToProps)(CreateWallet)

////////////////////////////// Buttons ////////////////////////////////////////

const Buttons = (props) => {

  return (
    <View style={styles.buttons}>

      <TouchableOpacity
        style={[styles.cancel]}
        onPress={props.onCancel}>
        <T style={styles.buttonText}>{CANCEL_TEXT}</T>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.submit]}
        onPress={props.onDone}>
        <T style={styles.buttonText}>{DONE_TEXT}</T>
      </TouchableOpacity>

    </View>
  )
}

////////////////////////////// WalletNameInput /////////////////////////////////

class WalletNameInput extends Component {
  render () {
    return (
      <View style={styles.pickerView}>
        <TextInput style={styles.picker}
          clearButtonMode={'while-editing'}
          autoCorrect={false}
          autoFocus={true}
          placeholder={this.props.placeholder}
          onChangeText={this.props.onChangeText} />
      </View>
    )
  }
}

////////////////////////////// DropDownPicker /////////////////////////////////

class DropdownPicker extends Component {
  constructor (props) {
    super(props)

    this.state = {
      searchTerm: '',
      isListVisible: false,
      selectedItem: '',
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
      isListVisible: true,
    })
  }

  handleOnBlur = () => {
    this.setState({
      isListVisible: false,
    })
  }

  handleSelectListItem = (listItem) => {
    this.setState({
      searchTerm: listItem,
      isListVisible: false,
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
    const {isListVisible, matchingListItems} = this.state

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

////////////////////////////// DropdownList ///////////////////////////////////

const DropdownList = props => {
  const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2})
  const dataSource = ds.cloneWithRows(props.dataSource)

  renderRow = data => {
    return (
      <TouchableOpacity
        style={{backgroundColor: 'white', padding: 10,}}
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
        renderRow={this.renderRow} />
    </View>
  )
}

////////////////////////////// End ////////////////////////////////////////////
