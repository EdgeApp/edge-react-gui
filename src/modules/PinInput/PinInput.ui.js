import React, { Component } from 'react'
import {
  View,
  ToastAndroid,
  AlertIOS,
  Platform,
  StyleSheet,
  Dimensions,
  Share,
  TextInput,
  TouchableHighlight,
  Keyboard
} from 'react-native'
import { connect } from 'react-redux'
// import styles from './styles.js'

const styles = StyleSheet.create({
  view: {
    flex: 1,
  },
  textInput: {
    flex: 1,
    textAlign: 'center'
  },
})

const PinInput = () => {

  const submitIfDone = (pin) => {
    if(isFullPin(pin)) {
      Keyboard.dismiss()
      alert('PIN SUBMIT')
    }
  }

  const isFullPin = (pin) => {
    return pin.length >= 4
  }

  return (
    <View style={styles.view}>
      <TextInput
        style={styles.textInput}
        keyboardType={'numeric'}
        secureTextEntry
        maxLength={4}
        placeholder={'PIN'}
        onChangeText={submitIfDone}/>
    </View>
  )
}

export default connect()(PinInput)
