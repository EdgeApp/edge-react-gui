import React from 'react'
import {Text, View, StyleSheet, TouchableHighlight} from 'react-native'
import {connect} from 'react-redux'

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

const KeyboardButton = ({character, onPress, onLongPress}) => (
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

export default connect()(KeyboardButton)
