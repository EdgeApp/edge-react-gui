// @flow

import React, { Component } from 'react'
import { Text, TextInput, View } from 'react-native'

import s from '../../locales/strings.js'
import styles from '../../styles/scenes/SendConfirmationStyle'

const PASSWORD_TEXT = s.strings.send_confirmation_enter_send_password

export type Props = {}
export default class Password extends Component<Props> {
  render () {
    return (
      <View style={styles.container}>
        <Text style={[styles.text, { fontSize: 14 }]}>{PASSWORD_TEXT}</Text>
        <View style={styles.textInputContainer}>
          <TextInput secureTextEntry style={styles.textInput} />
        </View>
      </View>
    )
  }
}
