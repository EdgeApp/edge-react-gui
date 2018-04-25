// @flow

import React, { Component } from 'react'
import { TextInput, View } from 'react-native'

import styles from './styles'

export type Props = {
  onPinChange: () => void
}
export class PinInput extends Component<Props> {
  render () {
    const { onPinChange } = this.props
    return (
      <View style={styles.view}>
        <TextInput style={styles.textInput} keyboardType={'numeric'} secureTextEntry maxLength={4} placeholder={'PIN'} onChangeText={onPinChange} />
      </View>
    )
  }
}

export default PinInput
