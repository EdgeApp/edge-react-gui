// @flow

import React, { Component } from 'react'
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
  tintColor?: string,
  baseColor?: string,
  label?: string,
  textColor?: string,
  fontSize?: number,
  titleFontSize?: number,
  labelFontSize?: number,
  labelHeight?: number,
  labelPadding?: number,
  inputContainerStyle?: Object,
  inputContainerPadding?: number,
  lineWidth?: number,
  activeLineWidth?: number,
  disabledLineWidth?: number,
  title?: string,
  prefix?: string,
  suffix?: string,
  error?: string,
  errorColor?: string,
  disabledLineType?: string,
  animationDuration?: number,
  characterRestriction?: Array<string>,
  disabled?: boolean,
  editable?: boolean,
  multiline?: boolean,
  containerStyle?: Object,
  labelTextStyle?: Object,
  titleTextStyle?: Object,
  affixTextStyle?: Object,
  renderAccessory?: boolean,
  secureTextEntry?: boolean,
  onChangeText?: Function,
  onFocus?: Function,
  onBlur?: Function,
  value?: Function
}
export type State = {}

export class PasswordInput extends Component<Props, State> {
  render () {
    const props = { ...DEFAULTS, ...this.props }
    return <TextField {...props} />
  }
}
