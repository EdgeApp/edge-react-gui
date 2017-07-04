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
  container: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 30,
    marginBottom: 15,
    marginHorizontal: 35
  },
  text: {
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 0,
    fontSize: 17
  },
  ellipsis: {
    flex: 1,
    overflow: 'hidden'
  }
})

const Recipient = ({label, address}) => {

  return (
      <View style={styles.container}>
        <Text style={[ styles.text, {fontSize: 14} ]}>To:  </Text>
        <Text style={styles.text}> {label}  |  </Text>
        <Text
          style={[ styles.text, styles.ellipsis ]}
          ellipsizeMode='middle' numberOfLines={1}
        >
           {address}
        </Text>
      </View>
  )
}

export default connect()(Recipient)
