// @flow

import React, {Component} from 'react'
import {Actions} from 'react-native-router-flux'
import {
  Alert,
  View,
  Keyboard,
  TouchableHighlight
} from 'react-native'

import SafeAreaView from '../../components/SafeAreaView'
import Text from '../../components/FormattedText'
import {SecondaryButton, PrimaryButton} from '../../components/Buttons'
import {FormField} from '../../../../components/FormField.js'
import SearchResults from '../../components/SearchResults'
import * as Constants from '../../../../constants/indexConstants.js'
import styles, {styles as stylesRaw} from './style.js'
import s from '../../../../locales/strings.js'
import Gradient from '../../components/Gradient/Gradient.ui.js'
import * as UTILS from '../../../utils'
import type {GuiFiatType, FlatListItem, DeviceDimensions} from '../../../../types'

export type CreateWalletSelectFiatOwnProps = {
  walletName: string,
  selectedWalletType: string,
  supportedFiats: Array<GuiFiatType>,
  dimensions: DeviceDimensions
}

type State = {
  searchTerm: string,
  selectedFiat: string
}

export type CreateWalletSelectFiatStateProps = {
  dimensions: DeviceDimensions,
  supportedFiats: Array<GuiFiatType>
}

export type CreateWalletSelectFiatComponentProps = CreateWalletSelectFiatOwnProps & CreateWalletSelectFiatStateProps

export class CreateWalletSelectFiatComponent extends Component<CreateWalletSelectFiatComponentProps, State> {
  constructor (props: CreateWalletSelectFiatComponentProps & State) {
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
      Actions[Constants.CREATE_WALLET_REVIEW]({
        walletName: this.props.walletName,
        selectedWalletType: this.props.selectedWalletType,
        selectedFiat: this.getFiatType(this.state.selectedFiat)
      })
    } else {
      Alert.alert(s.strings.create_wallet_invalid_input, s.strings.create_wallet_select_valid_fiat)
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
      return (entry.label.toLowerCase().indexOf(this.state.searchTerm.toLowerCase()) >= 0)
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
            label={s.strings.fragment_wallets_addwallet_fiat_hint}
          />
          <SearchResults
            renderRegularResultFxn={this.renderFiatTypeResult}
            onRegularSelectFxn={this.handleSelectFiatType}
            regularArray={filteredArray}
            style={[styles.SearchResults]}
            containerStyle={[styles.searchContainer]}
            keyExtractor={this.keyExtractor}
            initialNumToRender={30}
            scrollRenderAheadDistance={1600}
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
