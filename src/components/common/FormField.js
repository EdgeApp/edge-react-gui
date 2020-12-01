// @flow

import * as React from 'react'
import { TextField } from 'react-native-material-textfield'

import { THEME } from '../../theme/variables/airbitz.js'
import { PLATFORM } from '../../theme/variables/platform.js'

type Props = {|
  // From the react-native-material-textfield readme:
  error?: string,
  fontSize?: number,
  label: string,
  labelFontSize?: number,
  multiline?: boolean,
  onBlur?: () => void,
  onChangeText: (text: string) => void,
  onFocus?: () => void,
  prefix?: string,
  suffix?: string,
  titleFontSize?: number,

  // Other React Native TextInput properties:
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters',
  autoCorrect?: boolean,
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad' | 'numeric' | 'email-address' | 'phone-pad',
  maxLength?: number,
  onSubmitEditing?: () => void,
  returnKeyType?: 'done' | 'go' | 'next' | 'search' | 'send',
  secureTextEntry?: boolean,
  value: string,

  // Edge additions:
  autoFocus?: boolean,
  style?: {|
    container: any,
    baseColor: string,
    tintColor: string,
    textColor: string,
    errorColor: string,
    titleTextStyle: any
  |}
|}

export class FormField extends React.Component<Props> {
  static defaultProps = {
    autoCapitalize: 'none', // Native default is 'sentences'
    autoCorrect: false, // Native default is 'true'
    returnKeyType: 'go',
    keyboardType: 'default'
  }

  inputRef: { current: null | React$ElementRef<typeof TextField> } = React.createRef()

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
  titleTextStyle: {
    // color: THEME.COLORS.PRIMARY // this causes the forms to have a default text color EVEN ON ERROR
  }
}
