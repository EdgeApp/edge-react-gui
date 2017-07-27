import React, { Component } from 'react'
import { Text, View, StyleSheet, TouchableHighlight } from 'react-native'
import { connect } from 'react-redux'
// import styles from './styles.js'
import { Container, Content } from 'native-base'
import leftArrow from '../../../left-arrow.png'
import Button from 'react-native-button'

const styles = StyleSheet.create({
  view: {
    flex: 1,
    borderColor: 'red',
    borderWidth: 1,
    flexDirection: 'column'
  },
  containerStyle: {
    flex: 1,
    backgroundColor: 'white'
  },
  keyboardButton: {
    flex: 1,
    borderColor: 'red',
    borderWidth: 1,
    color: 'grey',
    fontWeight: '100',
    textAlign: 'center'
  }
})

const KeyboardButton = ({character, onPress, onLongPress}) => {
  return (
    <View style={styles.view}>
      <TouchableHighlight
        style={styles.containerStyle}
        underlayColor='#193441'
        onPress={() => { onPress(character) }}
        onLongPress={onLongPress}>

        <Text style={styles.keyboardButton}>{character}</Text>
      </TouchableHighlight>
    </View>
  )
}

export default connect()(KeyboardButton)
