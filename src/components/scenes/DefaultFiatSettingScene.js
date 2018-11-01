// @flow

import React, { Component } from 'react'
import { Alert, Keyboard, TouchableHighlight, View } from 'react-native'

import s from '../../locales/strings.js'
import Text from '../../modules/UI/components/FormattedText/index'
import Gradient from '../../modules/UI/components/Gradient/Gradient.ui'
import SafeAreaView from '../../modules/UI/components/SafeAreaView/index'
import SearchResults from '../../modules/UI/components/SearchResults/index'
import { MaterialInputOnWhite } from '../../styles/components/FormFieldStyles.js'
import styles, { styles as stylesRaw } from '../../styles/scenes/SettingsStyle.js'
import type { DeviceDimensions, FlatListItem, GuiFiatType } from '../../types'
import { FormField } from '../common/FormField.js'

const DEFAULT_FIAT_PICKER_PLACEHOLDER = s.strings.settings_select_currency
const INVALID_DATA_TEXT = s.strings.fragment_create_wallet_select_valid

type Props = {
  supportedFiats: Array<GuiFiatType>,
  onSelectFiat: string => void,
  dimensions: DeviceDimensions
}
type State = {
  supportedFiats: Array<GuiFiatType>,
  selectedFiat: string,
  searchTerm: string
}
export default class DefaultFiatSetting extends Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {
      searchTerm: '',
      supportedFiats: props.supportedFiats,
      selectedFiat: ''
    }
  }

  handleSearchTermChange = (searchTerm: string): void => {
    this.setState({
      searchTerm
    })
  }

  render () {
    const filteredArray = this.props.supportedFiats.filter(entry => {
      return entry.label.toLowerCase().indexOf(this.state.searchTerm.toLowerCase()) >= 0
    })
    const keyboardHeight = this.props.dimensions.keyboardHeight || 0
    const searchResultsHeight = stylesRaw.usableHeight - keyboardHeight - 34 // FormField height

    return (
      <SafeAreaView>
        <Gradient style={styles.gradient} />
        <View style={styles.body}>
          <FormField
            autoFocus
            clearButtonMode={'while-editing'}
            autoCorrect={false}
            autoCapitalize={'words'}
            onChangeText={this.handleSearchTermChange}
            value={this.state.searchTerm}
            label={DEFAULT_FIAT_PICKER_PLACEHOLDER}
            style={MaterialInputOnWhite}
          />
          <SearchResults
            renderRegularResultFxn={this.renderFiatTypeResult}
            onRegularSelectFxn={this.onSelectFiat}
            regularArray={filteredArray}
            containerStyle={[styles.searchContainer, { height: searchResultsHeight }]}
            keyExtractor={this.keyExtractor}
            initialNumToRender={30}
            scrollRenderAheadDistance={1600}
          />
        </View>
      </SafeAreaView>
    )
  }

  onSelectFiat = ({ value: selectedFiat }: { value: string }) => {
    if (!this.isValidFiat(selectedFiat)) {
      Alert.alert(INVALID_DATA_TEXT)
    } else {
      this.setState({ selectedFiat })
      Keyboard.dismiss()
      this.props.onSelectFiat(selectedFiat)
    }
  }

  isValidFiat = (selectedFiat: string) => {
    const { supportedFiats } = this.state

    const isValid = supportedFiats.find(fiat => fiat.value === selectedFiat)

    return isValid
  }

  renderFiatTypeResult = (data: FlatListItem, onRegularSelect: Function) => {
    return (
      <View style={[styles.singleFiatTypeWrap, data.item.value === this.state.selectedFiat && styles.selectedItem]}>
        <TouchableHighlight style={[styles.singleFiatType]} onPress={() => onRegularSelect(data.item)} underlayColor={stylesRaw.underlayColor.color}>
          <View style={[styles.fiatTypeInfoWrap]}>
            <View style={styles.fiatTypeLeft}>
              <View style={[styles.fiatTypeLeftTextWrap]}>
                <Text style={[styles.fiatTypeName]}>{data.item.label}</Text>
              </View>
            </View>
          </View>
        </TouchableHighlight>
      </View>
    )
  }

  keyExtractor = (item: GuiFiatType, index: string) => index
}
