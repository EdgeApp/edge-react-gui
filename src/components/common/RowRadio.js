// @flow

import React, { Component } from 'react'
import type { Node } from 'react'
import { TouchableOpacity, View } from 'react-native'
import IonIcon from 'react-native-vector-icons/Ionicons'

import styles, { styles as styleRaw } from '../../styles/scenes/SettingsStyle'

export type Props = {
  key: string,
  left: Node,
  isSelected: boolean,
  onPress: () => void
}
export default class RowRadio extends Component<Props> {
  render () {
    // const option = this.props.option
    const { key, left, isSelected, onPress } = this.props
    // console.log('Row render, option: ', option)
    const icon = isSelected ? (
      <IonIcon style={styles.radioButton} name="ios-radio-button-on" size={24} color="#4C78B8" />
    ) : (
      <IonIcon style={styles.radioButton} name="ios-radio-button-off" size={24} color="#58595C" />
    )

    return (
      <TouchableOpacity style={styles.rowContainer} underlayColor={styleRaw.underlay.color} key={key} onPress={onPress}>
        <View style={styles.rowTextRow}>
          <View style={styles.rowLeftContainer}>{left}</View>
          {icon}
        </View>
      </TouchableOpacity>
    )
  }
}
