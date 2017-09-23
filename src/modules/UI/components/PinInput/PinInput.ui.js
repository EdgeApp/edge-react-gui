import React, {Component} from 'react'
import {
  View,
  StyleSheet,
  TextInput
} from 'react-native'

const styles = StyleSheet.create({
  view: {
    flex: 1
  },
  textInput: {
    flex: 1,
    textAlign: 'center',
    color: 'white'
  }
})

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
