// @flow

import React, { Component } from 'react'
import { TextField } from 'react-native-material-textfield'

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
  maxLength?: number
}

type State = {
  inputText: string
}

class InputWithAutoFocus extends Component<Props, State> {
  static defaultProps = {
    autoCapitalize: 'none',
    autoCorrect: false,
    autoFocus: false,
    forceFocus: false,
    returnKeyType: 'go',
    onFocus: null,
    keyboardType: 'default',
    placeholder: ''
  }
  textInput: TextField
  UNSAFE_componentWillMount () {
    this.textInput = null
    this.setState({
      inputText: ''
    })
  }

  UNSAFE_componentWillReceiveProps (nextProps: any) {
    if (nextProps.value !== this.state.inputText) {
      this.setState({
        inputText: nextProps.value
      })
    }
  }

  render () {
    const value = this.props.value ? this.props.value : ''
    const error = this.props.error ? this.props.error : ''
    const { containerStyle, baseColor, tintColor, textColor, errorColor, titleTextStyle, secureTextEntry, returnKeyType } = this.props
    return (
      <TextField
        ref={this.addRef}
        label={this.props.label}
        value={value}
        onChangeText={this.onChange}
        error={error}
        containerStyle={containerStyle}
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
        labelHeight={26}
        keyboardType={this.props.keyboardType}
        placeholder={this.props.placeholder}
        maxLength={this.props.maxLength}
        autoFocus={this.props.autoFocus}
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

export { InputWithAutoFocus }
