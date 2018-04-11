/* eslint-disable flowtype/require-valid-file-annotation */

import React, { Component } from 'react'
import { StyleSheet, Text, TouchableHighlight, View } from 'react-native'

import THEME from '../../../../theme/variables/airbitz'

const styles = StyleSheet.create({
  view: {
    flex: 1,
    borderColor: THEME.COLORS.ACCENT_RED,
    borderWidth: 1,
    flexDirection: 'column'
  },
  containerStyle: {
    flex: 1,
    backgroundColor: THEME.COLORS.WHITE
  },
  keyboardButton: {
    flex: 1,
    borderColor: THEME.COLORS.ACCENT_RED,
    borderWidth: 1,
    color: THEME.COLORS.GRAY_3,
    fontWeight: '100',
    textAlign: 'center'
  },
  underlayColor: {
    color: THEME.COLORS.GRAY_1
  }
})

export default class KeyboardButton extends Component {
  render () {
    const { character, onPress, onLongPress } = this.props
    return (
      <View style={styles.view}>
        <TouchableHighlight
          style={styles.containerStyle}
          underlayColor={styles.color}
          onPress={() => {
            onPress(character)
          }}
          onLongPress={onLongPress}
        >
          <Text style={styles.keyboardButton}>{character}</Text>
        </TouchableHighlight>
      </View>
    )
  }
}
