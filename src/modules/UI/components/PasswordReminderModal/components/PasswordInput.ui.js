// @flow

import React, { Component } from 'react'
import { TextField } from 'react-native-material-textfield'

import { THEME } from '../../../../../theme/variables/airbitz.js'
import s from '../../../../../locales/strings.js'

const DEFAULTS = {
  secureTextEntry: true,
  tintColor: THEME.COLORS.GRAY_2,
  baseColor: THEME.COLORS.GRAY_2
}

const PASSWORD_TEXT = s.strings.password

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
    const {
      secureTextEntry,
      tintColor,
      baseColor,
      label,
      inputContainerStyle,
      textColor,
      fontSize,
      titleFontSize,
      labelFontSize,
      labelHeight,
      labelPadding,
      inputContainerPadding,
      lineWidth,
      activeLineWidth,
      disabledLineWidth,
      title,
      prefix,
      suffix,
      error,
      errorColor,
      disabledLineType,
      animationDuration,
      characterRestriction,
      disabled,
      editable,
      multiline,
      containerStyle,
      labelTextStyle,
      titleTextStyle,
      affixTextStyle,
      renderAccessory,
      onChangeText,
      onFocus,
      onBlur,
      value
    } = this.props
    return (
      <TextField
        secureTextEntry={secureTextEntry || DEFAULTS.secureTextEntry}
        tintColor={tintColor || DEFAULTS.tintColor}
        baseColor={baseColor || DEFAULTS.baseColor}
        label={label || PASSWORD_TEXT}
        inputContainerStyle={inputContainerStyle}
        textColor={textColor}
        fontSize={fontSize}
        titleFontSize={titleFontSize}
        labelFontSize={labelFontSize}
        labelHeight={labelHeight}
        labelPadding={labelPadding}
        inputContainerPadding={inputContainerPadding}
        lineWidth={lineWidth}
        activeLineWidth={activeLineWidth}
        disabledLineWidth={disabledLineWidth}
        title={title}
        prefix={prefix}
        suffix={suffix}
        error={error}
        errorColor={errorColor}
        disabledLineType={disabledLineType}
        animationDuration={animationDuration}
        characterRestriction={characterRestriction}
        disabled={disabled}
        editable={editable}
        multiline={multiline}
        containerStyle={containerStyle}
        labelTextStyle={labelTextStyle}
        titleTextStyle={titleTextStyle}
        affixTextStyle={affixTextStyle}
        renderAccessory={renderAccessory}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
        value={value}
      />
    )
  }
}
