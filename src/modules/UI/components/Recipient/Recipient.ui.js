import React, {Component} from 'react'
import {
  View,
  Text
} from 'react-native'
import strings from '../../../../locales/default.js'

import styles from './styles'

const SENT_TO_TEXT = strings.enUS['send_to_title']

export default class Recipient extends Component {
  render () {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>
          {SENT_TO_TEXT}
        </Text>
        <Text style={styles.text}
          ellipsizeMode='middle' numberOfLines={1}>
          {this.props.publicAddress}
        </Text>
      </View>
    )
  }
}
