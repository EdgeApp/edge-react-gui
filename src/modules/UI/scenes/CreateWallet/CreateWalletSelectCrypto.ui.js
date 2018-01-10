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
import Gradient from '../../components/Gradient/Gradient.ui'
import * as UTILS from '../../../utils'
import type {GuiWalletType, FlatListItem, DeviceDimensions} from '../../../../types'

const WALLET_TYPE_PICKER_PLACEHOLDER = s.strings.create_wallet_choose_crypto

const BACK_TEXT = s.strings.title_back
const INVALID_INPUT_TITLE = s.strings.create_wallet_invalid_input
const INVALID_DATA_TEXT = s.strings.create_wallet_select_valid_crypto
const NEXT_TEXT = s.strings.string_next_capitalized

export type Props = {
  walletName: string,
  dimensions: DeviceDimensions,
  supportedWalletTypes: Array<GuiWalletType>
}

export type State = {
  selectedWalletType: string,
  searchTerm: string
}

export default class CreateWalletSelectCrypto extends Component<Props, State> {
  constructor (props: Props & State) {
    super(props)
    this.state = {
      selectedWalletType: '',
      searchTerm: ''
    }
  }

  isValidWalletType = (): boolean => {
    const {selectedWalletType} = this.state
    const {supportedWalletTypes} = this.props
    const walletTypeValue = supportedWalletTypes
      .findIndex((walletType) => walletType.value === selectedWalletType)

    const isValid: boolean = walletTypeValue >= 0
    return isValid
  }

  getWalletType = (walletTypeValue: string): GuiWalletType => {
    const {supportedWalletTypes} = this.props
    const foundValueIndex = supportedWalletTypes.findIndex((walletType) => walletType.value === walletTypeValue)
    const foundValue = supportedWalletTypes[foundValueIndex]

    return foundValue
  }

  onNext = (): void => {
    if (this.isValidWalletType()) {
      Actions.createWalletSelectFiat({
        walletName: this.props.walletName,
        selectedWalletType: this.getWalletType(this.state.selectedWalletType)
      })
    } else {
      Alert.alert(INVALID_INPUT_TITLE, INVALID_DATA_TEXT)
    }
  }

  onBack = (): void => {
    Keyboard.dismiss()
    Actions.pop() // redirect to the list of wallets
  }

  handleSearchTermChange = (searchTerm: string): void => {
    this.setState({
      searchTerm
    })
  }

  handleSelectWalletType = (item: GuiWalletType): void => {
    const selectedWalletType = this.props.supportedWalletTypes.find((type) => type.value === item.value)
    if (selectedWalletType) {
      this.setState({
        selectedWalletType: selectedWalletType.value,
        searchTerm: selectedWalletType.label
      })
    }
  }

  handleOnFocus = () => {
    UTILS.noOp()
  }

  handleOnBlur = () => {
    UTILS.noOp()
  }

  render () {
    const filteredArray = this.props.supportedWalletTypes.filter((entry) => {
      return (entry.label.indexOf(this.state.searchTerm) >= 0)
    })
    const isDisabled = !this.isValidWalletType()
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
            label={WALLET_TYPE_PICKER_PLACEHOLDER}
          />
          <SearchResults
            renderRegularResultFxn={this.renderWalletTypeResult}
            onRegularSelectFxn={this.handleSelectWalletType}
            regularArray={filteredArray}
            style={[styles.SearchResults]}
            containerStyle={[styles.searchContainer, {height: searchResultsHeight}] }
            keyExtractor={this.keyExtractor}
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

  renderWalletTypeResult = (data: FlatListItem, onRegularSelect: Function) => {
    return (
      <View style={[styles.singleCryptoTypeWrap, (data.item.value === this.state.selectedWalletType) && styles.selectedItem]}>
        <TouchableHighlight style={[styles.singleCryptoType]}
          onPress={() => onRegularSelect(data.item)}
          underlayColor={stylesRaw.underlayColor.color}>
          <View style={[styles.cryptoTypeInfoWrap]}>
            <View style={styles.cryptoTypeLeft}>
              <View style={[styles.cryptoTypeLogo]} >
                {
                  data.item.symbolImageDarkMono
                  ? <Image source={{uri: data.item.symbolImageDarkMono}} style={[styles.cryptoTypeLogo, {borderRadius: 20}]} />
                  : <View style={styles.cryptoTypeLogo} />
                }

              </View>
              <View style={[styles.cryptoTypeLeftTextWrap]}>
                <Text style={[styles.cryptoTypeName]}>{data.item.label} - {data.item.currencyCode}</Text>
              </View>
            </View>
          </View>
        </TouchableHighlight>
      </View>
    )
  }

  keyExtractor = (item: GuiWalletType, index: number): number => index
}
