import React, { Component } from 'react'
import {
  ScrollView,
  Text,
  View,
  StyleSheet,
  ListView,
  Button,
  TouchableOpacity,
  TextInput } from 'react-native'
import { connect } from 'react-redux'
import styles from './styles.js'
import { dev } from '../utils.js'
import {updateNewWalletName} from './action'
import LinearGradient from 'react-native-linear-gradient'

import { addWallet } from '../Wallets/Wallets.action.js'
import FakeAccount from '../../Fakes/FakeAccount.js'
import { Actions } from 'react-native-router-flux'

// import { MKTextField as TextInput } from 'react-native-material-kit'

const WALLET_NAME_INPUT_PLACEHOLDER = 'Name your new wallet'
const BLOCKCHAIN_PICKER_PLACEHOLDER = 'Choose a blockchain'
const FIAT_PICKER_PLACEHOLDER       = 'Choose a fiat currency'

const DONE_TEXT         = 'DONE'
const CANCEL_TEXT       = 'CANCEL'
const INVALID_DATA_TEXT = 'Please select valid data'

////////////////////////////// ROOT ///////////////////////////////////////////

class AddWallet extends Component {
  constructor (props) {
    super(props)

    this.state = {
      supportedBlockchains: [],
      supportedFiats: [],
      selectedWalletName: '',
      selectedBlockchain: '',
      selectedFiat: '',
    }
  }

  componentDidMount () {
    const supportedBlockchains = this.getSupportedBlockchains()
    const supportedFiats = this.getSupportedFiats()

    this.setState({
      supportedBlockchains,
      supportedFiats
    })
  }

  getSupportedBlockchains = () => {
    const supportedBlockchains = [
      'Bitcoin',
      'Dash',
      'Dogecoin',
      'Ethereum',
      'Litecoin',
      'Shitcoin',
      'Bitcoin',
    ]

    return supportedBlockchains
  }

  getSupportedFiats = () => {
    const supportedFiats = [
      'US Dollar',
      'European Euro',
      'British Pound',
      'Japanese Yen',
      'Chinese Yuan',
      'Mexican Peso',
    ]

    return supportedFiats
  }

  isValidData = () => {
    const isValidWalletName = !!this.isValidWalletName()
    const isValidBlockchain = !!this.isValidBlockchain()
    const isValidFiat = !!this.isValidFiat()

    if (isValidWalletName && isValidBlockchain && isValidFiat) {
      return true
    }

    return false
  }

  isValidWalletName = () => {
    const isValid = this.props.nameInput

    return isValid
  }

  isValidBlockchain = () => {
    const {
      supportedBlockchains,
      selectedBlockchain } = this.state

    const isValid = supportedBlockchains.find((blockchain) => {
      return blockchain === selectedBlockchain
    })

    return isValid
  }

  isValidFiat = () => {
    const {
      supportedFiats,
      selectedFiat } = this.state

      const isValid = supportedFiats.find((fiat) => {
        return fiat === selectedFiat
      })

    return isValid
  }

  handleOnDone = () => {
    if (!this.isValidData()) {
      alert(INVALID_DATA_TEXT)
    } else {
      // determine wallet type
      const walletType = 'wallet.repo.myFakeWalletType'
      // get new keys from txLib
      const walletKeys = ['MASTER_PRIVATE_KEY', 'MASTER_PUBLIC_KEY']
      // create new wallet from airbitz.createWallet(this.selectedBlockchain, fake keys), returns wallet ID
      // const walletId = this.props.account.createWallet(walletType, walletKeys)
      FakeAccount.createWallet(walletType, walletKeys)
        .then(walletId => {
          // get wallet by ID from the account
          // const newWallet = this.props.account.getWallet(walletID)
          const newWallet = FakeAccount.getWallet(walletId)
          newWallet.name = this.props.nameInput
          // save new wallet in redux
          const order = Object.keys(this.props.wallets).length
          this.props.dispatch(addWallet(newWallet, order))
          // ??? wallet.rename(this.state.selectedWalletName) ???
          // ??? wallet.addFiat(this.state.selectedFiat) ???
          Actions.walletList() //redirect to the list of wallets
        })
    }
  }

  handleOnCancel = () => {
    Actions.walletList() //redirect to the list of wallets
  }

  handleChangeWalletName = (input) => {
    this.props.dispatch(updateNewWalletName(input))
  }

  handleSelectWalletName = (selectedWalletName) => {
    this.setState({
      selectedWalletName
    })
  }

  handleSelectBlockchain = (selectedBlockchain) => {
    this.setState({
      selectedBlockchain
    })
  }

  handleSelectFiat = (selectedFiat) => {
    this.setState({
      selectedFiat
    })
  }

  render () {

    return (
      <LinearGradient
        style={styles.view}
        start={{x:0,y:0}} end={{x:1, y:0}}
        colors={["#3b7adb","#2b569a"]}
        centerContent={true}>

        <WalletNameInput
          placeholder={WALLET_NAME_INPUT_PLACEHOLDER}
          onSelect={ this.handleSelectWalletName }
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

      </LinearGradient>
    )
  }
}

export default connect( state => ({
  wallets: state.wallets.wallets,
  nameInput: state.addWallet.newWalletName
}))(AddWallet)

////////////////////////////// Buttons ////////////////////////////////////////

const Buttons = (props) => {

  return (
    <View style={styles.buttons}>

      <TouchableOpacity
        style={styles.cancel}
        onPress={props.onCancel}>
        <Text style={styles.buttonText}>{CANCEL_TEXT}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.submit}
        onPress={props.onDone}>
        <Text style={styles.buttonText}>{DONE_TEXT}</Text>
      </TouchableOpacity>

    </View>
  )
}

////////////////////////////// WalletNameInput /////////////////////////////////

class WalletNameInput extends Component {
  constructor (props) {
    super(props)

    this.state = {}
  }

  render () {
    return (
      <View style={styles.pickerView}>
        <TextInput style={styles.picker}
          clearButtonMode={'while-editing'}
          onChangeText={this.props.onSelect}
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

const DropdownList = (props) => {
  const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2})
  const dataSource = ds.cloneWithRows(props.dataSource)

  renderRow = (data) => {
    return (
      <TouchableOpacity
        style={{backgroundColor: 'white', padding: 10,}}
        onPress={() => props.onPress(data)}>
        <Text>{data}</Text>
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
