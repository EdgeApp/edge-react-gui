/* eslint-disable flowtype/require-valid-file-annotation */

import * as React from 'react'
import { TextField } from 'react-native-material-textfield'

import { THEME } from '../../theme/variables/airbitz.js'
import { PLATFORM } from '../../theme/variables/platform.js'

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

class FormField extends React.Component<Props> {
*/
export class FormField extends React.Component {
  static defaultProps = {
    autoCapitalize: 'none',
    autoCorrect: false,
    autoFocus: false,
    returnKeyType: 'go',
    label: '',
    keyboardType: 'default',
    multiline: false
  }

  inputRef = React.createRef()

  componentDidMount() {
    if (this.props.autoFocus && this.inputRef.current != null) {
      this.inputRef.current.focus()
    }
  }

  render() {
    const { style = {} } = this.props
    const { container, baseColor, tintColor, textColor, errorColor, titleTextStyle } = style

    return (
      <TextField
        ref={this.inputRef}
        label={this.props.label}
        onChangeText={this.props.onChangeText}
        error={this.props.error}
        containerStyle={container}
        secureTextEntry={this.props.secureTextEntry}
        returnKeyType={this.props.returnKeyType}
        fontSize={this.props.fontSize}
        titleFontSize={this.props.titleFontSize}
        labelFontSize={this.props.labelFontSize}
        baseColor={baseColor}
        tintColor={tintColor}
        textColor={textColor}
        errorColor={errorColor}
        titleTextStyle={titleTextStyle}
        onFocus={this.props.onFocus}
        onBlur={this.props.onBlur}
        autoCapitalize={this.props.autoCapitalize}
        onSubmitEditing={this.props.onSubmitEditing}
        value={this.props.value}
        keyboardType={this.props.keyboardType}
        maxLength={this.props.maxLength}
        autoCorrect={this.props.autoCorrect}
        multiline={this.props.multiline}
        suffix={this.props.suffix}
        prefix={this.props.prefix}
      />
    )
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
