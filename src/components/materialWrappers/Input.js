// @flow

import * as React from 'react'
import { TextField } from 'react-native-material-textfield'

import { scale } from '../../util/scaling.js'

type Props = {
  value: string,
  label: string,
  error: string,
  autoCapitalize: string,
  autoCorrect: boolean,
  autoFocus: boolean,
  forceFocus: boolean,
  returnKeyType: string,
  containerStyle: any,
  fontSize: number,
  titleFontSize: number,
  labelFontSize: number,
  baseColor: string,
  tintColor: string,
  textColor: string,
  errorColor: string,
  titleTextStyle: any,
  secureTextEntry: boolean,
  returnKeyType: string,
  keyboardType: string,
  placeholder: string,
  onFocus(): void,
  onSubmitEditing(): void,
  onBlur(): void,
  onChangeText(string): void,
  maxLength?: number,
  multiline?: boolean,
  numberOfLines?: number,
  suffix?: string,
  prefix?: string
}

type State = {
  inputText: string,
  autoFocus: boolean
}

class Input extends React.Component<Props, State> {
  static defaultProps = {
    autoCapitalize: 'none',
    autoCorrect: false,
    autoFocus: false,
    forceFocus: false,
    returnKeyType: 'go',
    onFocus: null,
    keyboardType: 'default',
    multiline: true,
    placeholder: ''
  }

  textInput: TextField
  UNSAFE_componentWillMount() {
    this.textInput = null
    this.setState({
      inputText: '',
      autoFocus: this.props.autoFocus
    })
  }

  componentDidMount() {
    if (this.props.autoFocus) {
      this.textInput.focus()
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps: any) {
    if (nextProps.value !== this.state.inputText) {
      this.setState({
        inputText: nextProps.value,
        autoFocus: nextProps.autoFocus
      })
    }
    if (nextProps.autoFocus && !this.props.autoFocus) {
      this.textInput.focus()
    }
    if (nextProps.forceFocus) {
      this.textInput.focus()
    }
  }

  render() {
    const value = this.props.value ? this.props.value : ''
    const error = this.props.error ? this.props.error : ''
    const {
      containerStyle,
      fontSize,
      titleFontSize,
      labelFontSize,
      baseColor,
      tintColor,
      textColor,
      errorColor,
      titleTextStyle,
      secureTextEntry,
      returnKeyType,
      autoCorrect,
      multiline,
      suffix,
      prefix
    } = this.props
    return (
      <TextField
        ref={this.addRef}
        label={this.props.label}
        value={value}
        onChangeText={this.onChange}
        error={error}
        containerStyle={containerStyle}
        fontSize={scale(fontSize) || scale(16)}
        titleFontSize={scale(titleFontSize) || scale(12)}
        labelFontSize={scale(labelFontSize) || scale(12)}
        baseColor={baseColor}
        tintColor={tintColor}
        textColor={textColor}
        errorColor={errorColor}
        titleTextStyle={titleTextStyle}
        secureTextEntry={secureTextEntry}
        autoCapitalize={this.props.autoCapitalize}
        returnKeyType={returnKeyType}
        onBlur={this.onBlur}
        onFocus={this.onFocus}
        onSubmitEditing={this.onSubmitEditing}
        labelHeight={scale(26)}
        keyboardType={this.props.keyboardType}
        placeholder={this.props.placeholder}
        maxLength={this.props.maxLength}
        numberOfLines={this.props.numberOfLines}
        multiline={multiline}
        autoCorrect={autoCorrect}
        suffix={suffix}
        prefix={prefix}
      />
    )
  }

  addRef = (arg?: TextField) => {
    if (arg) {
      this.textInput = arg
    }
  }

  onChange = (text: string) => {
    this.setState({
      inputText: text
    })
    this.props.onChangeText(text)
  }

  onSubmitEditing = () => {
    if (this.props.onSubmitEditing) {
      this.props.onSubmitEditing()
    }
  }

  onFocus = () => {
    if (this.props.onFocus) {
      this.props.onFocus()
    }
  }

  onBlur = () => {
    if (this.props.onBlur) {
      this.props.onBlur()
    }
  }
}

export { Input }
