// @flow

import React, {Component} from 'react'
import {Actions} from 'react-native-router-flux'
import {
  Alert,
  View,
  Keyboard,
  TouchableHighlight,
  Image
} from 'react-native'
import SafeAreaView from '../../components/SafeAreaView'
import Text from '../../components/FormattedText'
import {SecondaryButton, PrimaryButton} from '../../components/Buttons'
import {FormField} from '../../../../components/FormField.js'
import SearchResults from '../../components/SearchResults'
import * as Constants from '../../../../constants/indexConstants.js'
import styles, {styles as stylesRaw} from './style.js'
import s from '../../../../locales/strings.js'
import Gradient from '../../components/Gradient/Gradient.ui'
import * as UTILS from '../../../utils'
import type {GuiWalletType, FlatListItem, DeviceDimensions} from '../../../../types'

export type CreateWalletSelectCryptoOwnProps = {
  walletName: string,
  dimensions: DeviceDimensions,
  supportedWalletTypes: Array<GuiWalletType>
}
export type CreateWalletSelectCryptoStateProps = {
  supportedWalletTypes: Array<GuiWalletType>,
  dimensions: DeviceDimensions
}

type State = {
  selectedWalletType: string,
  searchTerm: string
}

export type CreateWalletSelectCryptoComponentProps = CreateWalletSelectCryptoOwnProps & CreateWalletSelectCryptoStateProps

export class CreateWalletSelectCryptoComponent extends Component<CreateWalletSelectCryptoComponentProps, State> {
  constructor (props: CreateWalletSelectCryptoComponentProps & State) {
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
      Actions[Constants.CREATE_WALLET_SELECT_FIAT]({
        walletName: this.props.walletName,
        selectedWalletType: this.getWalletType(this.state.selectedWalletType)
      })
    } else {
      Alert.alert(s.strings.create_wallet_invalid_input, s.strings.create_wallet_select_valid_crypto)
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
      return ((entry.label.toLowerCase().indexOf(this.state.searchTerm.toLowerCase()) >= 0) ||
              (entry.currencyCode.toLowerCase().indexOf(this.state.searchTerm.toLowerCase()) >= 0))
    })

    return (
      <SafeAreaView>
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
            label={s.strings.create_wallet_choose_crypto}
          />
          <SearchResults
            renderRegularResultFxn={this.renderWalletTypeResult}
            onRegularSelectFxn={this.handleSelectWalletType}
            regularArray={filteredArray}
            style={[styles.SearchResults]}
            containerStyle={[styles.searchContainer] }
            keyExtractor={this.keyExtractor}
          />
          <View style={[styles.buttons]}>
            <SecondaryButton
              style={[styles.cancel]}
              onPressFunction={this.onBack}
              text={s.strings.title_back} />

            <PrimaryButton
              style={[styles.next]}
              onPressFunction={this.onNext}
              text={s.strings.string_next_capitalized}
            />
          </View>
        </View>
      </View>
      </SafeAreaView>
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
