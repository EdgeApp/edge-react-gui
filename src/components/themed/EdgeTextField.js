// @flow

import * as React from 'react'
import { type TextFieldProps, TextField } from 'react-native-material-textfield'

import { unpackEdges } from '../../util/edges.js'
import { type ThemeProps, withTheme } from '../services/ThemeContext.js'

type EdgeTextFieldProps = {
  marginRem?: number | number[]
}

export class EdgeTextFieldComponent extends React.PureComponent<EdgeTextFieldProps & ThemeProps & TextFieldProps> {
  render() {
    const { theme, marginRem = 0.5, ...rest } = this.props
    const margin = unpackEdges(marginRem)
    return (
      <TextField
        containerStyle={{
          marginBottom: theme.rem(margin.bottom),
          marginLeft: theme.rem(margin.left),
          marginRight: theme.rem(margin.right),
          marginTop: theme.rem(margin.top)
        }}
        baseColor={theme.primaryText}
        errorColor={theme.dangerText}
        textColor={theme.primaryText}
        tintColor={theme.primaryText}
        {...rest}
      />
    )
  }
}

export const EdgeTextField = withTheme(EdgeTextFieldComponent)
