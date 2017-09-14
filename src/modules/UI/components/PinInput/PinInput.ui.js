import React from 'react'
import {
  View,
  StyleSheet,
  TextInput
} from 'react-native'
import {connect} from 'react-redux'
// import styles from './styles.js'

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

const PinInput = ({onPinChange}) => (
    <View style={styles.view}>
      <TextInput
        style={styles.textInput}
        keyboardType={'numeric'}
        secureTextEntry
        maxLength={4}
        placeholder={'PIN'}
        onChangeText={onPinChange} />
    </View>
  )

export default connect()(PinInput)
