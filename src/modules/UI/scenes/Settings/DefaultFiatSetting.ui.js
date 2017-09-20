import React, {Component} from 'react'
import {
  Alert,
  Keyboard,
  View
} from 'react-native'
import DropdownPicker from '../../components/DropdownPicker/index'
import {sprintf} from 'sprintf-js'
import strings from '../../../../locales/default'

const DEFAULT_FIAT_PICKER_PLACEHOLDER = sprintf(strings.enUS['settings_select_currency'])
const INVALID_DATA_TEXT = sprintf(strings.enUS['fragment_create_wallet_select_valid'])

export default class DefaultFiatSetting extends Component {
  constructor (props) {
    super(props)
    this.state = {
      supportedFiats: props.supportedFiats,
      selectedFiat: ''
    }
  }

  onSelectFiat = () => {
    if (!this.isValidFiat()) {
      Alert.alert(INVALID_DATA_TEXT)
    } else {
      this.setState({isCreatingWallet: true})
      Keyboard.dismiss()
      const {
        selectedFiat
      } = this.state
      this.props.selectFiat(selectedFiat)
    }
  }

  isValidFiat = () => {
    const {
      selectedFiat,
      supportedFiats
    } = this.state

    const isValid = supportedFiats
      .find((fiat) => fiat.value === selectedFiat)

    return isValid
  }

  render () {
    const {
      supportedFiats
    } = this.state

    return <View>
      <DropdownPicker
        keyboardShouldPersistTaps={'always'}
        listItems={supportedFiats || []}
        placeholder={DEFAULT_FIAT_PICKER_PLACEHOLDER}
        onSelect={this.onSelectFiat} />
    </View>
  }
}
