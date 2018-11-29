// @flow

import React, { Component } from 'react'
import { Alert, TouchableHighlight, View } from 'react-native'
import { Actions } from 'react-native-router-flux'

import * as Constants from '../../constants/indexConstants.js'
import s from '../../locales/strings.js'
import Text from '../../modules/UI/components/FormattedText/index'
import Gradient from '../../modules/UI/components/Gradient/Gradient.ui.js'
import SafeAreaView from '../../modules/UI/components/SafeAreaView/index'
import SearchResults from '../../modules/UI/components/SearchResults/index'
import styles, { styles as stylesRaw } from '../../styles/scenes/CreateWalletStyle.js'
import type { DeviceDimensions, FlatListItem, GuiFiatType } from '../../types'
import * as UTILS from '../../util/utils'
import { FormField } from '../common/FormField.js'

export type CreateWalletSelectFiatOwnProps = {
  selectedWalletType: string,
  supportedFiats: Array<GuiFiatType>,
  dimensions: DeviceDimensions
}
export type CreateWalletSelectFiatStateProps = {
  dimensions: DeviceDimensions,
  supportedFiats: Array<GuiFiatType>
}
export type Props = CreateWalletSelectFiatOwnProps & CreateWalletSelectFiatStateProps
type State = {
  searchTerm: string,
  selectedFiat: string
}

export class CreateWalletSelectFiat extends Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {
      searchTerm: '',
      selectedFiat: ''
    }
  }

  isValidFiatType = () => {
    const { selectedFiat } = this.state
    const fiatTypeIndex = this.props.supportedFiats.findIndex(fiatType => fiatType.value === selectedFiat)
    const isValid = fiatTypeIndex >= 0
    return isValid
  }

  getFiatType = (fiatKey: string) => {
    const fiatTypeIndex = this.props.supportedFiats.findIndex(fiatType => fiatType.value === fiatKey)

    return this.props.supportedFiats[fiatTypeIndex]
  }

  onNext = () => {
    if (this.isValidFiatType()) {
      // check if account-based or not
      const nextSceneKey = this.props.selectedWalletType.currencyCode === 'EOS' ? Constants.CREATE_WALLET_ACCOUNT : Constants.CREATE_WALLET_NAME
      Actions[nextSceneKey]({
        selectedWalletType: this.props.selectedWalletType,
        selectedFiat: this.getFiatType(this.state.selectedFiat)
      })
    } else {
      Alert.alert(s.strings.create_wallet_invalid_input, s.strings.create_wallet_select_valid_fiat)
    }
  }

  handleSearchTermChange = (searchTerm: string) => {
    this.setState({
      searchTerm
    })
  }

  handleSelectFiatType = (item: GuiFiatType) => {
    const selectedFiat = this.props.supportedFiats.find(type => type.value === item.value)

    if (selectedFiat) {
      this.setState(
        {
          selectedFiat: selectedFiat.value,
          searchTerm: selectedFiat.label
        },
        this.onNext
      )
    }
  }

  handleOnFocus = () => {
    UTILS.noOp()
  }

  handleOnBlur = () => {
    UTILS.noOp()
  }

  render () {
    const filteredArray = this.props.supportedFiats.filter(entry => {
      return entry.label.toLowerCase().indexOf(this.state.searchTerm.toLowerCase()) >= 0
    })
    const keyboardHeight = this.props.dimensions.keyboardHeight || 0
    const searchResultsHeight = stylesRaw.usableHeight - keyboardHeight - 58 // substract button area height and FormField height
    return (
      <SafeAreaView>
        <View style={styles.scene}>
          <Gradient style={styles.gradient} />
          <View style={styles.view}>
            <FormField
              style={styles.picker}
              autoFocus
              clearButtonMode={'while-editing'}
              onFocus={this.handleOnFocus}
              onBlur={this.handleOnBlur}
              autoCorrect={false}
              autoCapitalize={'words'}
              onChangeText={this.handleSearchTermChange}
              value={this.state.searchTerm}
              label={s.strings.fragment_wallets_addwallet_fiat_hint}
              returnKeyType={'search'}
            />
            <SearchResults
              renderRegularResultFxn={this.renderFiatTypeResult}
              onRegularSelectFxn={this.handleSelectFiatType}
              regularArray={filteredArray}
              style={[styles.SearchResults]}
              containerStyle={[styles.searchContainer, { height: searchResultsHeight }]}
              keyExtractor={this.keyExtractor}
              initialNumToRender={30}
              scrollRenderAheadDistance={1600}
            />
          </View>
        </View>
      </SafeAreaView>
    )
  }

  renderFiatTypeResult = (data: FlatListItem, onRegularSelect: Function) => {
    return (
      <View style={[styles.singleCryptoTypeWrap, data.item.value === this.state.selectedFiat && styles.selectedItem]}>
        <TouchableHighlight style={[styles.singleCryptoType]} onPress={() => onRegularSelect(data.item)} underlayColor={stylesRaw.underlayColor.color}>
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
