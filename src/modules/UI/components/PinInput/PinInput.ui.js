// @flow

import React, { Component } from 'react'
import { StyleSheet } from 'react-native'
import { TextField } from 'react-native-material-textfield'

import { THEME } from '../../../../theme/variables/airbitz.js'
import s from '../../../../locales/strings.js'

const rawStyles = {
  pinInput: {}
}
const styles = StyleSheet.create(rawStyles)

const DEFAULTS = {
  secureTextEntry: true,
  tintColor: THEME.COLORS.GRAY_2,
  baseColor: THEME.COLORS.GRAY_2,
  label: s.strings.pin,
  keyboardType: 'numeric'
}

export type Props = {
  style?: StyleSheet.Styles,
  onChangePin: (pin: string) => mixed
}
export type State = {}
export class PinInput extends Component<Props, State> {
  render () {
    const { onChangePin, style, ...props } = this.props
    return <TextField style={[styles.pinInput, style]} maxLength={4} onChangeText={onChangePin} {...DEFAULTS} {...props} />
  }
}

export default PinInput
