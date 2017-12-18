import React, {Component} from 'react'
import {
  View,
  Text,
  TextInput
} from 'react-native'
import styles from '../styles'
import s from '../../../../../locales/strings.js'

const PASSWORD_TEXT = s.strings.send_confirmation_enter_send_password

export default class Password extends Component {
  render () {
    return (
      <View style={styles.container}>
        <Text style={[ styles.text, {fontSize: 14} ]}>
          {PASSWORD_TEXT}
        </Text>
        <View style={styles.textInputContainer}>
          <TextInput secureTextEntry style={styles.textInput} />
        </View>
      </View>
    )
  }
}
