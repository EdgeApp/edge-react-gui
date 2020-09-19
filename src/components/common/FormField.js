/* eslint-disable flowtype/require-valid-file-annotation */

import * as React from 'react'

import { THEME } from '../../theme/variables/airbitz.js'
import { PLATFORM } from '../../theme/variables/platform.js'
import { Input } from '../materialWrappers/Input.js'
import { InputWithAutoFocus } from '../materialWrappers/InputWithAutoFocus.js'

/*
type Props = {

 fontSize: number,
 titleFontSize: number,
 labelFontSize: number,
 style: StyleSheet.Styles,
 label?: string,
 value?: string,
 placeholder?: string,
 autoCorrect: boolean,
 autoFocus: boolean,
 forceFocus: boolean,
 autoCapitalize?: string,
 secureTextEntry?: boolean,
 showSecureCheckbox?: boolean,
 returnKeyType?: string,
 error?: string,
 onSubmitEditing(): void,
 onFocus(): void,
 onBlur(): void,
 onChangeText(string):void,
}

type State = {
 secure: boolean,
 autoFocus: boolean
}

class FormField extends React.Component<Props, State> {
*/
export class FormField extends React.Component {
  static defaultProps = {
    autoCapitalize: 'none',
    autoCorrect: false,
    autoFocus: false,
    forceFocus: false,
    returnKeyType: 'go',
    label: '',
    keyboardType: 'default',
    multiline: false
  }

  UNSAFE_componentWillMount() {
    const secure = this.props.secureTextEntry ? this.props.secureTextEntry : false
    this.setState({
      secure: secure,
      autoFocus: this.props.autoFocus
    })
  }

  render() {
    const { style = {} } = this.props
    const { container, baseColor, tintColor, textColor, errorColor, titleTextStyle } = style
    if (this.props.autoFocus) {
      return (
        <InputWithAutoFocus
          label={this.props.label}
          onChangeText={this.props.onChangeText}
          error={this.props.error}
          containerStyle={container}
          secureTextEntry={this.state.secure}
          returnKeyType={this.props.returnKeyType}
          fontSize={this.props.fontSize}
          titleFontSize={this.props.titleFontSize}
          labelFontSize={this.props.labelFontSize}
          baseColor={baseColor}
          tintColor={tintColor}
          textColor={textColor}
          errorColor={errorColor}
          titleTextStyle={titleTextStyle}
          forceFocus={this.props.forceFocus}
          onFocus={this.props.onFocus}
          onBlur={this.props.onBlur}
          autoCapitalize={this.props.autoCapitalize}
          onSubmitEditing={this.onSubmitEditing.bind(this)}
          value={this.props.value}
          keyboardType={this.props.keyboardType}
          maxLength={this.props.maxLength}
          autoCorrect={this.props.autoCorrect || false}
          autoFocus={this.state.autoFocus}
          multiline={this.props.multiline}
          suffix={this.props.suffix}
          prefix={this.props.prefix}
        />
      )
    } else {
      return (
        <Input
          label={this.props.label}
          onChangeText={this.props.onChangeText}
          error={this.props.error}
          containerStyle={container}
          secureTextEntry={this.state.secure}
          returnKeyType={this.props.returnKeyType}
          fontSize={this.props.fontSize}
          titleFontSize={this.props.titleFontSize}
          labelFontSize={this.props.labelFontSize}
          baseColor={baseColor}
          tintColor={tintColor}
          textColor={textColor}
          errorColor={errorColor}
          titleTextStyle={titleTextStyle}
          autoFocus={this.state.autoFocus}
          forceFocus={this.props.forceFocus}
          onFocus={this.props.onFocus}
          onBlur={this.props.onBlur}
          autoCapitalize={this.props.autoCapitalize}
          onSubmitEditing={this.onSubmitEditing.bind(this)}
          value={this.props.value}
          keyboardType={this.props.keyboardType}
          maxLength={this.props.maxLength}
          autoCorrect={this.props.autoCorrect || false}
          multiline={this.props.multiline}
          suffix={this.props.suffix}
          prefix={this.props.prefix}
        />
      )
    }
  }

  onSubmitEditing = () => {
    if (this.props.onSubmitEditing) {
      this.props.onSubmitEditing()
    }
  }
}

export const MaterialInputOnWhite = {
  container: {
    position: 'relative',
    width: PLATFORM.deviceWidth / 1.52,
    height: 60
  },
  baseColor: THEME.COLORS.PRIMARY,
  tintColor: THEME.COLORS.SECONDARY,
  errorColor: THEME.COLORS.ACCENT_RED,
  textColor: THEME.COLORS.BLACK,
  affixTextStyle: {
    color: THEME.COLORS.ACCENT_RED
  },
  titleTextStyle: {
    // color: THEME.COLORS.PRIMARY // this causes the forms to have a default text color EVEN ON ERROR
  }
}
