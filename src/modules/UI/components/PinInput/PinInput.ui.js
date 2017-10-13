import React, {Component} from 'react'
import {
  View,
  TextInput
} from 'react-native'

import styles from './styles'

export default class PinInput extends Component {
  render () {
    const {onPinChange} = this.props
    return <View style={styles.view}>
      <TextInput
        style={styles.textInput}
        keyboardType={'numeric'}
        secureTextEntry
        maxLength={4}
        placeholder={'PIN'}
        onChangeText={onPinChange} />
    </View>
  }
}
