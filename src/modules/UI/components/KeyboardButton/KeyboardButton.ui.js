import React, {Component} from 'react'
import {Text, View, StyleSheet, TouchableHighlight} from 'react-native'

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

export default class KeyboardButton extends Component {
  render () {
    const {character, onPress, onLongPress}= this.props
    return <View style={styles.view}>
      <TouchableHighlight
        style={styles.containerStyle}
        underlayColor='#193441'
        onPress={() => { onPress(character) }}
        onLongPress={onLongPress}>

        <Text style={styles.keyboardButton}>{character}</Text>
      </TouchableHighlight>
    </View>
  }
}
