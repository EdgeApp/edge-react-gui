import React, { Component } from 'react'
// import * as Constants from '../../../common/constants'
import { Input } from './materialWrappers/indexMaterial'

class FormField extends Component {
  static defaultProps = {
    autoCapitalize: 'none',
    autoCorrect: false,
    autoFocus: false,
    forceFocus: false,
    returnKeyType: 'go',
    label: '',
    keyboardType: 'default'
  }
  componentWillMount () {
    const secure = this.props.secureTextEntry
      ? this.props.secureTextEntry
      : false
    this.setState({
      secure: secure,
      autoFocus: this.props.autoFocus
    })
  }
  render () {
    const {
      container,
      baseColor,
      tintColor,
      textColor,
      errorColor,
      titleTextStyle

    } = this.props.style
    return (
      <Input
        label={this.props.label}
        onChangeText={this.props.onChangeText}
        error={this.props.error}
        containerStyle={container}
        secureTextEntry={this.state.secure}
        returnKeyType={this.props.returnKeyType}
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
      />
    )
  }
  onSubmitEditing = () => {
    if (this.props.onSubmitEditing) {
      this.props.onSubmitEditing()
    }
  }
}

export { FormField }
