// @flow

import * as React from 'react'
import { TextField } from 'react-native-material-textfield'

import { type ThemeProps, withTheme } from '../services/ThemeContext.js'

class EdgeTextFieldComponent extends React.PureComponent<ThemeProps> {
  render() {
    const { theme, ...props } = this.props
    return <TextField textColor={theme.primaryText} tintColor={theme.primaryText} baseColor={theme.primaryText} errorColor={theme.dangerText} {...props} />
  }
}

export const EdgeTextField = withTheme(EdgeTextFieldComponent)
