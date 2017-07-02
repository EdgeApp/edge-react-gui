import React, { Component } from 'react'
import {
  Clipboard,
  View,
  ToastAndroid,
  Platform,
  StyleSheet,
  Dimensions,
  Share,
  Text,
  TouchableHighlight,
  TextInput
} from 'react-native'
import { connect } from 'react-redux'
// import styles from './styles.js'

const styles = StyleSheet.create({
  view: {
  },
  row: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    paddingHorizontal: 10
  },
  text: {
    color: 'white',
  }
})

const Recipient = ({label, address}) => {

  return (
      <View style={styles.row}>
        <Text style={styles.text}>To: {label} </Text>
        <Text style={styles.text}
          adjustFontToFit
          ellipsizeMode="middle"
          numberOfLines={1}>
          {address}
        </Text>
      </View>
  )
}

export default connect()(Recipient)
