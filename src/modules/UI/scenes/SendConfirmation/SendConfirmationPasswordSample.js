import React, { Component } from 'react'
import {
  View,
  Text,
  TouchableHighlight,
  StyleSheet,
  TextInput
} from 'react-native'
import { connect } from 'react-redux'


export default class Password extends Component {

  render () {
    return (
      <View style={styles.container}>
        <Text style={[ styles.text, { fontSize: 14 } ]}>Password:</Text>
        <View style={styles.textInputContainer}>
          <TextInput secureTextEntry={true} style={styles.textInput} />
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginHorizontal: 35
  },
  text: {
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 0,
    fontSize: 17
  },
  textInputContainer: {
    flex: 1,
    marginLeft: 8,
    borderBottomColor: "#FFF",
    borderBottomWidth: 0.5,
    borderStyle: 'solid',
    padding: 3
  },
  textInput: {
    height: 26,
    fontSize: 26,
    color: 'rgba(255,255,255,0.85)'
  }
})
