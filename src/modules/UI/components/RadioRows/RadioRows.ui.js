/* eslint-disable flowtype/require-valid-file-annotation */

import React, { Component } from 'react'
import { TouchableOpacity, View } from 'react-native'
import IonIcon from 'react-native-vector-icons/Ionicons'

import { border as b } from '../../../../util/utils'
import T from '../../components/FormattedText'
import s from './style'

class RadioRows extends Component {
  handlePress (value, option) {
    // console.log('inside of RadioRows->handlePress')
    this.props.onSelect(value, option) // reference to inherited function
  }

  render () {
    // console.log('RadioRows render, this.props is: ', this.props)
    return (
      <View style={[{ height: 200 }]}>
        {this.props.options.map(option => (
          <TouchableOpacity onPress={() => this.handlePress(option.value, this.props.option)} style={[s.rowContainer, b('blue')]} key={option.value}>
            <View style={[s.rowTextRow, b('red')]}>
              <View style={[s.rowLeftContainer, b('blue')]}>
                <T style={[s.rowLeftText, b('green')]}>{option.text}</T>
              </View>
              {option.boolean ? (
                <IonIcon name="ios-radio-button-on" size={24} style={[s.radioButton, b('blue')]} color="#4C78B8" />
              ) : (
                <IonIcon name="ios-radio-button-off" size={24} style={[s.radioButton, b('blue')]} color="#58595C" />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    )
  }
}

export default RadioRows
