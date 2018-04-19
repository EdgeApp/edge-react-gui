/* eslint-disable flowtype/require-valid-file-annotation */

import React, { Component } from 'react'
import { TextField } from 'react-native-material-textfield'

class PasswordComponent extends Component {
  /* static defaultProps = {
    secureTextEntry: false
  } */
  render () {
    const { container, baseColor, tintColor, textColor, errorColor, titleTextStyle } = this.props.style
    return (
      <TextField
        label={this.props.label}
        value={this.props.value}
        onChangeText={this.props.onChangeText}
        containerStyle={container}
        baseColor={baseColor}
        tintColor={tintColor}
        textColor={textColor}
        errorColor={errorColor}
        titleTextStyle={titleTextStyle}
        secureTextEntry={this.props.secureTextEntry}
        returnKeyType={this.props.returnKeyType}
        onSubmitEditing={this.props.onFinish}
      />
    )
  }
}

export { PasswordComponent }
