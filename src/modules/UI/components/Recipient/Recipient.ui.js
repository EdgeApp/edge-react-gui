import React, { Component } from 'react'
import {
  View,
  StyleSheet,
  Text
} from 'react-native'
import {sprintf} from 'sprintf-js'
import strings from '../../../../locales/default.js'

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 35,
    marginHorizontal: 35
  },
  text: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    marginHorizontal: 5
  }
})

export default class Recipient extends Component {
  render () {
    return (
      <View style={styles.container}>
        <Text style={[ styles.text ]}>
          {sprintf(strings.enUS['send_to_title'])}
        </Text>
        <Text style={[ styles.text ]}
          ellipsizeMode='middle' numberOfLines={1}>
          {this.props.publicAddress}
        </Text>
      </View>
    )
  }
}
