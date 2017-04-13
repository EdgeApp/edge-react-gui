import React, { Component } from 'react'
import {
  Clipboard,
  View,
  ToastAndroid,
  AlertIOS,
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
    borderColor: 'red',
    borderWidth: 1,
  },
  text: {
    flex: 1,
  }
})

const Recipient = ({to}) => {

  isAddress = () => {

  }

  isBip70 = () => {

  }

  isLabel = () => {

  }

  return (
    <View style={styles.view}>
      <Text style={styles.text}>To: Amalia Miller (1a98...4Lfw)</Text>
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
