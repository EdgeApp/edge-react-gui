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

const WALLET_NAME_INPUT_PLACEHOLDER = s.strings.fragment_wallets_addwallet_name_hint
const WALLET_TYPE_PICKER_PLACEHOLDER = s.strings.create_wallet_choose_crypto
const FIAT_PICKER_PLACEHOLDER = s.strings.fragment_wallets_addwallet_fiat_hint

const DONE_TEXT = s.strings.fragment_create_wallet_create_wallet
const CANCEL_TEXT = s.strings.string_cancel_cap
const BACK_TEXT = s.strings.title_back
const INVALID_DATA_TEXT = s.strings.fragment_create_wallet_select_valid
const NEXT_TEXT = s.strings.string_next_capitalized

export default class CreateWallet extends Component {
  constructor (props) {
    super(props)
    this.state = {
      walletName: this.props.walletName || '',
      searchTerm: '',
      selectedFiat: ''
    }
  }

  isValidFiatType = () => {
    const {selectedFiat} = this.state
    const isValid = this.props.supportedFiats
      .findIndex((fiatType) => fiatType.value === selectedFiat)

    return (isValid >= 0)
  }

  onNext = () => {
    Actions.createWalletReview({
      walletName: this.props.walletName,
      selectedWalletType: this.props.selectedWalletType,
      selectedFiat: this.state.selectedFiat
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

  handleSelectFiatType = (item) => {
    const selectedFiat = this.props.supportedFiats.find((type) => type.value === item.value)
    this.setState({
      selectedFiat: selectedFiat.value,
      searchTerm: selectedFiat.label
    })
  }

  render () {
    const filteredArray = this.props.supportedFiats.filter((entry) => {
      return (entry.label.indexOf(this.state.searchTerm) >= 0)
    })
    const isDisabled = !this.isValidFiatType()

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
            label={FIAT_PICKER_PLACEHOLDER}
          />
          <SearchResults
            renderRegularResultFxn={this.renderFiatTypeResult}
            onRegularSelectFxn={this.handleSelectFiatType}
            regularArray={filteredArray}
            style={[styles.SearchResults]}
            containerStyle={[styles.searchContainer, {height: PLATFORM.usableHeight - 50 - 58 - this.props.dimensions.keyboardHeight}]}
            keyExtractor={this.keyExtractor}
            initialNumToRender={30}
            scrollRenderAheadDistance={1600}
          />
          <View style={[styles.buttons]}>
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

  renderFiatTypeResult = (data, onRegularSelectFxn) => {
    return (
      <View style={styles.singleCryptoTypeWrap}>
        <TouchableHighlight style={[styles.singleCryptoType]}
          onPress={() => onRegularSelectFxn(data.item)}
          underlayColor={stylesRaw.underlayColor.color}>
          <View style={[styles.cryptoTypeInfoWrap]}>
            <View style={styles.cryptoTypeLeft}>
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
