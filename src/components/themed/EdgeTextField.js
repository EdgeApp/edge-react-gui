// @flow

import * as React from 'react'
// $FlowFixMe = OutlinedTextField is not recognize by flow
import { type TextFieldProps, OutlinedTextField, TextField } from 'react-native-material-textfield'

import { unpackEdges } from '../../util/edges.js'
import { type ThemeProps, withTheme } from '../services/ThemeContext.js'

type EdgeTextFieldProps = {
  fieldRef?: ?React.ElementRef<typeof OutlinedTextField>,
  marginRem?: number | number[]
}

type Props = EdgeTextFieldProps & ThemeProps & TextFieldProps

class EdgeTextFieldComponent extends React.PureComponent<Props> {
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

class EdgeTextFieldOutlinedComponent extends React.PureComponent<Props> {
  render() {
    const { marginRem = 0.5, theme, ...rest } = this.props
    const margin = unpackEdges(marginRem)
    return (
      <OutlinedTextField
        containerStyle={{
          marginBottom: theme.rem(margin.bottom),
          marginLeft: theme.rem(margin.left),
          marginRight: theme.rem(margin.right),
          marginTop: theme.rem(margin.top)
        }}
        baseColor={theme.secondaryText}
        errorColor={theme.dangerText}
        textColor={theme.primaryText}
        tintColor={theme.textLink}
        ref={this.props.fieldRef}
        {...rest}
      />
    )
  }
}

export const EdgeTextField = withTheme(EdgeTextFieldComponent)
const EdgeTextFieldOutlinedInner = withTheme(EdgeTextFieldOutlinedComponent)
// $FlowFixMe = forwardRef is not recognize by flow?
export const EdgeTextFieldOutlined = React.forwardRef((props, ref) => <EdgeTextFieldOutlinedInner {...props} fieldRef={ref} />) // eslint-disable-line
