/* eslint-disable flowtype/require-valid-file-annotation */

import React, { Component } from 'react'
import { Text, View } from 'react-native'

import s from '../../../../locales/strings'
import styles from './styles'

const SENT_TO_TEXT = s.strings.send_to_title

export default class Recipient extends Component {
  render () {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>{SENT_TO_TEXT}</Text>
        <Text style={styles.text} ellipsizeMode="middle" numberOfLines={1}>
          {this.props.publicAddress}
        </Text>
      </View>
    )
  }
}
