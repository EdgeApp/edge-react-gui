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
    flex: 1,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 10
  },
  text: {
    flex: 1,
    color: 'white',
  },
  spacer: {
    flex: 1
  }
})

const Recipient = ({label, address}) => {

  return (
    <View style={styles.view}>
      <View style={styles.spacer}></View>

      <View style={styles.row}>
        <Text style={styles.text}>To: {label} </Text>
        <Text style={styles.text}
          adjustFontToFit
          ellipsizeMode="middle"
          numberOfLines={1}>
          {address}
        </Text>
      </View>

      <View style={styles.spacer}></View>
    </View>
  )
}

export default connect()(Recipient)


{/* <View style={styles.view}>
  <Text
    adjustFontToFit
    ellipsizeMode="middle"
    numberOfLines={1}
    style={{
      flex: 1
    }}
    >To: {to}</Text>
</View> */}
