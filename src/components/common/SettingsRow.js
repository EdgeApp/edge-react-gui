// @flow

import type { Node } from 'react'
import React, { Component } from 'react'
import { TouchableHighlight, View } from 'react-native'
import IonIcon from 'react-native-vector-icons/Ionicons'

import styles, { styles as styleRaw } from '../../styles/SettingsComponentsStyle'

type Props = {
  left: Node,
  isSelected: boolean,
  onPress: () => void
}

class Row extends Component<Props> {
  render () {
    const { left, isSelected, onPress } = this.props

    const icon = isSelected ? (
      <IonIcon style={[styles.radioButton]} name="ios-radio-button-on" />
    ) : (
      <IonIcon style={[styles.radioButton, styles.radioButtonSelected]} name="ios-radio-button-off" />
    )

    return (
      <TouchableHighlight style={[styles.rowContainer]} underlayColor={styleRaw.underlay.color} onPress={onPress}>
        <View style={[styles.rowTextRow]}>
          <View style={[styles.rowLeftContainer]}>{left}</View>
          {icon}
        </View>
      </TouchableHighlight>
    )
  }
}

export default Row
