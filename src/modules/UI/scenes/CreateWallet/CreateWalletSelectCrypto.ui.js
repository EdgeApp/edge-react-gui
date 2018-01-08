import React, {Component} from 'react'
import {Actions} from 'react-native-router-flux'
import {
  ActivityIndicator,
  Alert,
  View,
  Keyboard,
  TouchableHighlight,
  Image
} from 'react-native'
import Text from '../../components/FormattedText'
import {SecondaryButton, TertiaryButton} from '../../components/Buttons'
import {FormField} from '../../../../components/FormField.js'
import SearchResults from '../../components/SearchResults'

import styles, {styles as stylesRaw} from './style.js'
import s from '../../../../locales/strings.js'
import PLATFORM from '../../../../theme/variables/platform'
import Gradient from '../../components/Gradient/Gradient.ui'
import * as UTILS from '../../../utils'

const WALLET_TYPE_PICKER_PLACEHOLDER = s.strings.create_wallet_choose_crypto

const BACK_TEXT = s.strings.title_back
const INVALID_DATA_TEXT = s.strings.fragment_create_wallet_select_valid
const NEXT_TEXT = s.strings.string_next_capitalized

export default class CreateWallet extends Component {
  constructor (props) {
    super(props)
    this.state = {
      isCreatingWallet: false,
      walletInfoValid: false,
      walletName: this.props.walletName || '',
      selectedWalletType: '',
      searchTerm: '',
      selectedFiat: ''
    }
  }

  isValidWalletType = () => {
    const {selectedWalletType} = this.state
    const isValid = this.props.supportedWalletTypes
      .findIndex((walletType) => walletType.value === selectedWalletType)

    return (isValid >= 0)
  }

  onNext = () => {
    console.log('this is a test')
    Actions.createWalletSelectFiat({
      walletName: this.props.walletName,
      selectedWalletType: this.state.selectedWalletType
    })
  }

  onBack = () => {
    Keyboard.dismiss()
    Actions.pop() // redirect to the list of wallets
  }

  handleSearchTermChange = (searchTerm) => {
    this.setState({
      searchTerm
    })
  }

  handleSelectWalletType = (item) => {
    const selectedWalletType = this.props.supportedWalletTypes.find((type) => type.value === item.value)
    this.setState({
      selectedWalletType: selectedWalletType.value,
      searchTerm: selectedWalletType.label
    })
  }

  render () {
    const filteredArray = this.props.supportedWalletTypes.filter((entry) => {
      return (entry.label.indexOf(this.state.searchTerm) >= 0)
    })
    const isDisabled = !this.isValidWalletType()

    return (
      <View style={styles.scene}>
        <Gradient style={styles.gradient} />
        <View style={styles.view}>
          <FormField style={styles.picker}
            autoFocus
            clearButtonMode={'while-editing'}
            onFocus={this.handleOnFocus}
            onBlur={this.handleOnBlur}
            autoCorrect={false}
            autoCapitalize={'words'}
            onChangeText={this.handleSearchTermChange}
            value={this.state.searchTerm}
            label={WALLET_TYPE_PICKER_PLACEHOLDER}
          />
          <SearchResults
            renderRegularResultFxn={this.renderWalletTypeResult}
            onRegularSelectFxn={this.handleSelectWalletType}
            regularArray={filteredArray}
            style={[styles.SearchResults, UTILS.border()]}
            containerStyle={[styles.searchContainer, {height: PLATFORM.usableHeight - 50 - 58 - this.props.dimensions.keyboardHeight}] }
            keyExtractor={this.keyExtractor}
          />
          <View style={[styles.buttons, UTILS.border()]}>
            <SecondaryButton
              style={[styles.cancel]}
              onPressFunction={this.onBack}
              text={BACK_TEXT} />

            <TertiaryButton
              style={[styles.next]}
              disabled={isDisabled}
              onPressFunction={this.onNext}
              text={NEXT_TEXT}
            />
          </View>
        </View>
      </View>
    )
  }

  renderWalletTypeResult = (data, onRegularSelectFxn) => {
    return (
      <View style={styles.singleCryptoTypeWrap}>
        <TouchableHighlight style={[styles.singleCryptoType]}
          onPress={() => onRegularSelectFxn(data.item)}
          underlayColor={stylesRaw.underlayColor.color}>
          <View style={[styles.cryptoTypeInfoWrap]}>
            <View style={styles.cryptoTypeLeft}>
              <View style={[styles.cryptoTypeLogo]} >
                {
                  data.item.symbolImageDarkMono
                  ? <Image source={{uri: data.item.symbolImageDarkMono}} style={{height: 40, width: 40, borderRadius: 20}} />
                  : <View style={{height: 40, width: 40}} />
                }

              </View>
              <View style={[styles.cryptoTypeLeftTextWrap]}>
                <Text style={[styles.cryptoTypeName]}>{data.item.label}</Text>
              </View>
            </View>
          </View>
        </TouchableHighlight>
      </View>
    )
  }

  keyExtractor = (item, index) => index
}
