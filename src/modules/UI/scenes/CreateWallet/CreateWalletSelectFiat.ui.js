// @flow

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
import {SecondaryButton, PrimaryButton} from '../../components/Buttons'
import {FormField} from '../../../../components/FormField.js'
import SearchResults from '../../components/SearchResults'

import styles, {styles as stylesRaw} from './style.js'
import s from '../../../../locales/strings.js'
import PLATFORM from '../../../../theme/variables/platform'
import Gradient from '../../components/Gradient/Gradient.ui.js'
import * as UTILS from '../../../utils'
import type
{
  GuiWalletType,
  GuiFiatType,
  FlatListItem,
  DeviceDimensions
} from '../../../../types'

const WALLET_NAME_INPUT_PLACEHOLDER = s.strings.fragment_wallets_addwallet_name_hint
const WALLET_TYPE_PICKER_PLACEHOLDER = s.strings.create_wallet_choose_crypto
const FIAT_PICKER_PLACEHOLDER = s.strings.fragment_wallets_addwallet_fiat_hint

const DONE_TEXT = s.strings.fragment_create_wallet_create_wallet
const CANCEL_TEXT = s.strings.string_cancel_cap
const BACK_TEXT = s.strings.title_back
const INVALID_DATA_TITLE = s.strings.create_wallet_invalid_input
const INVALID_DATA_TEXT = s.strings.create_wallet_select_valid_fiat
const NEXT_TEXT = s.strings.string_next_capitalized

export type Props = {
  walletName: string,
  selectedWalletType: string,
  supportedFiats: Array<GuiFiatType>,
  dimensions: DeviceDimensions
}

export type State = {
  searchTerm: string,
  selectedFiat: string
}

export default class CreateWalletSelectFiat extends Component<Props, State> {
  constructor (props: Props & State) {
    super(props)
    this.state = {
      walletName: this.props.walletName || '',
      searchTerm: '',
      selectedFiat: ''
    }
  }

  isValidFiatType = (): boolean => {
    const {selectedFiat} = this.state
    const fiatTypeIndex = this.props.supportedFiats
      .findIndex((fiatType) => fiatType.value === selectedFiat)
    const isValid = fiatTypeIndex >= 0
    return isValid
  }

  getFiatType = (fiatKey: string): GuiFiatType => {
    const fiatTypeIndex = this.props.supportedFiats
      .findIndex((fiatType) => fiatType.value === fiatKey)

    return this.props.supportedFiats[fiatTypeIndex]
  }

  onNext = (): void => {
    if (this.isValidFiatType()) {
      Actions.createWalletReview({
        walletName: this.props.walletName,
        selectedWalletType: this.props.selectedWalletType,
        selectedFiat: this.getFiatType(this.state.selectedFiat)
      })
    } else {
      Alert.alert(INVALID_DATA_TITLE, INVALID_DATA_TEXT)
    }
  }

  onBack = (): void => {
    Keyboard.dismiss()
    Actions.pop() // redirect to the list of crypto types
  }

  handleSearchTermChange = (searchTerm: string): void => {
    this.setState({
      searchTerm
    })
  }

  handleSelectFiatType = (item: GuiFiatType): void => {
    const selectedFiat = this.props.supportedFiats.find((type) => type.value === item.value)

    if (selectedFiat) {
      this.setState({
        selectedFiat: selectedFiat.value,
        searchTerm: selectedFiat.label
      })
    }
  }

  handleOnFocus = (): void => {
    UTILS.noOp()
  }

  handleOnBlur = (): void => {
    UTILS.noOp()
  }

  render () {
    const filteredArray = this.props.supportedFiats.filter((entry) => {
      return (entry.label.indexOf(this.state.searchTerm) >= 0)
    })
    const isDisabled = !this.isValidFiatType()
    const keyboardHeight = this.props.dimensions.keyboardHeight || 0
    const searchResultsHeight = PLATFORM.usableHeight - keyboardHeight - 50 - 58 // substract button area height and FormField height

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
            containerStyle={[styles.searchContainer, {height: searchResultsHeight}]}
            keyExtractor={this.keyExtractor}
            initialNumToRender={30}
            scrollRenderAheadDistance={1600}
          />
          <View style={[styles.buttons]}>
            <SecondaryButton
              style={[styles.cancel]}
              onPressFunction={this.onBack}
              text={BACK_TEXT} />

            <PrimaryButton
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

  renderFiatTypeResult = (data: FlatListItem, onRegularSelect: Function) => {
    return (
      <View style={[styles.singleCryptoTypeWrap, (data.item.value === this.state.selectedFiat) && styles.selectedItem]}>
        <TouchableHighlight style={[styles.singleCryptoType]}
          onPress={() => onRegularSelect(data.item)}
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

  keyExtractor = (item: GuiFiatType, index: string) => index
}
