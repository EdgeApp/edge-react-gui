import * as React from 'react'
import { TextField, TextFieldProps } from 'react-native-material-textfield'

import { fixSides, mapSides, sidesToMargin } from '../../util/sides'
import { ThemeProps, withTheme } from '../services/ThemeContext'

interface EdgeTextFieldProps {
  marginRem?: number | number[]
}

export class EdgeTextFieldComponent extends React.PureComponent<EdgeTextFieldProps & ThemeProps & TextFieldProps> {
  render() {
    const { theme, marginRem, ...rest } = this.props
    const margin = sidesToMargin(mapSides(fixSides(marginRem, 0.5), theme.rem))

    return (
      <TextField
        containerStyle={margin}
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
