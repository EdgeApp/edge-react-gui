// @flow

import React, { Component } from 'react'
import { StyleSheet } from 'react-native'
import { TextField } from 'react-native-material-textfield'

import s from '../../../../../locales/strings.js'
import { THEME } from '../../../../../theme/variables/airbitz.js'

const DEFAULTS = {
  secureTextEntry: true,
  tintColor: THEME.COLORS.GRAY_2,
  baseColor: THEME.COLORS.GRAY_2,
  label: s.strings.password
}

export type Props = {
  activeLineWidth?: number,
  affixTextStyle?: StyleSheet.Styles,
  animationDuration?: number,
  baseColor?: string,
  characterRestriction?: Array<string>,
  containerStyle?: StyleSheet.Styles,
  disabled?: boolean,
  disabledLineType?: string,
  disabledLineWidth?: number,
  editable?: boolean,
  error?: string,
  errorColor?: string,
  fontSize?: number,
  inputContainerPadding?: number,
  inputContainerStyle?: StyleSheet.Styles,
  label?: string,
  labelFontSize?: number,
  labelHeight?: number,
  labelPadding?: number,
  labelTextStyle?: StyleSheet.Styles,
  lineWidth?: number,
  multiline?: boolean,
  onBlur?: Function,
  onChangeText?: Function,
  onFocus?: Function,
  prefix?: string,
  renderAccessory?: boolean,
  secureTextEntry?: boolean,
  suffix?: string,
  textColor?: string,
  tintColor?: string,
  title?: string,
  titleFontSize?: number,
  titleTextStyle?: StyleSheet.Styles,
  value?: string
}
export type State = {}

export class PasswordInput extends Component<Props, State> {
  render () {
    const props = { ...DEFAULTS, ...this.props }
    return <TextField {...props} />
  }
}
