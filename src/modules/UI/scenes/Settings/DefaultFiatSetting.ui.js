// @flow

import React, {Component} from 'react'
import {
  Alert,
  Keyboard,
  View
} from 'react-native'
import DropdownPicker from '../../components/DropdownPicker/indexDropdownPicker'
import s from '../../../../locales/strings.js'

import SafeAreaView from '../../components/SafeAreaView'
import Gradient from '../../components/Gradient/Gradient.ui'

import styles from './style'

const DEFAULT_FIAT_PICKER_PLACEHOLDER = s.strings.settings_select_currency
const INVALID_DATA_TEXT = s.strings.fragment_create_wallet_select_valid

type Props = {
  supportedFiats: Array<{value: string}>,
  onSelectFiat: (string) => void
}
type State = {
  supportedFiats: Array<{value: string}>,
  selectedFiat: string
}
export default class DefaultFiatSetting extends Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {
      supportedFiats: props.supportedFiats,
      selectedFiat: ''
    }
  }

  render () {
    const {supportedFiats} = this.state
    return (
      <SafeAreaView>
        <Gradient style={styles.gradient} />
        <View style={styles.body}>
          <DropdownPicker
            startOpen
            autoFocus
            keyboardShouldPersistTaps={'always'}
            listItems={supportedFiats || []}
            placeholder={DEFAULT_FIAT_PICKER_PLACEHOLDER}
            onSelect={this.onSelectFiat} />
        </View>
      </SafeAreaView>
    )
  }

  onSelectFiat = ({value: selectedFiat}: {value: string}) => {
    if (!this.isValidFiat(selectedFiat)) {
      Alert.alert(INVALID_DATA_TEXT)
    } else {
      this.setState({selectedFiat})
      Keyboard.dismiss()
      this.props.onSelectFiat(selectedFiat)
    }
  }

  isValidFiat = (selectedFiat: string) => {
    const {
      supportedFiats
    } = this.state

    const isValid = supportedFiats
      .find((fiat) => fiat.value === selectedFiat)

    return isValid
  }
}
