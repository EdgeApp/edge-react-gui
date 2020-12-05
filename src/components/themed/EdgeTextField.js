// @flow

import * as React from 'react'
import { type TextFieldProps, TextField } from 'react-native-material-textfield'

import { type ThemeProps, withTheme } from '../services/ThemeContext.js'

type Props = ThemeProps & TextFieldProps

class EdgeTextFieldComponent extends React.PureComponent<Props> {
  render() {
    const { theme, ...rest } = this.props
    return <TextField baseColor={theme.primaryText} errorColor={theme.dangerText} textColor={theme.primaryText} tintColor={theme.primaryText} {...rest} />
  }
}

export const EdgeTextField = withTheme(EdgeTextFieldComponent)
