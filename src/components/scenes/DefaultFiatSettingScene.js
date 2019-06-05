// @flow

import React, { Component } from 'react'
import { Alert, FlatList, Keyboard, TouchableHighlight, View } from 'react-native'

import s from '../../locales/strings.js'
import Text from '../../modules/UI/components/FormattedText/index'
import { MaterialInputOnWhite } from '../../styles/components/FormFieldStyles.js'
import styles, { styles as stylesRaw } from '../../styles/scenes/SettingsStyle.js'
import type { FlatListItem, GuiFiatType } from '../../types'
import { FormField } from '../common/FormField.js'
import { SceneWrapper } from '../common/SceneWrapper.js'

const DEFAULT_FIAT_PICKER_PLACEHOLDER = s.strings.settings_select_currency
const INVALID_DATA_TEXT = s.strings.fragment_create_wallet_select_valid

type Props = {
  supportedFiats: Array<GuiFiatType>,
  onSelectFiat: string => void
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

    return (
      <SceneWrapper avoidKeyboard hasTabs={false}>
        {gap => (
          <View style={[styles.content, { marginBottom: -gap.bottom }]}>
            <FormField
              autoFocus
              clearButtonMode={'while-editing'}
              autoCorrect={false}
              autoCapitalize={'words'}
              onChangeText={this.handleSearchTermChange}
              value={this.state.searchTerm}
              label={DEFAULT_FIAT_PICKER_PLACEHOLDER}
              style={[MaterialInputOnWhite, { width: '100%' }]}
            />
            <FlatList
              style={styles.resultList}
              automaticallyAdjustContentInsets={false}
              contentContainerStyle={{ paddingBottom: gap.bottom }}
              data={filteredArray}
              initialNumToRender={30}
              keyboardShouldPersistTaps="handled"
              keyExtractor={this.keyExtractor}
              renderItem={this.renderFiatTypeResult}
            />
          </View>
        )}
      </SceneWrapper>
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

  renderFiatTypeResult = (data: FlatListItem) => {
    return (
      <View style={[styles.singleFiatTypeWrap, data.item.value === this.state.selectedFiat && styles.selectedItem]}>
        <TouchableHighlight style={[styles.singleFiatType]} onPress={() => this.onSelectFiat(data.item)} underlayColor={stylesRaw.underlayColor.color}>
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

  keyExtractor = (item: GuiFiatType, index: string) => String(index)
}
