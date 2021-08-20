// @flow

import * as React from 'react'
import { type TextFieldProps, TextField } from 'react-native-material-textfield'

import { THEME } from '../../theme/variables/airbitz.js'
import { PLATFORM } from '../../theme/variables/platform.js'

type Props = {|
  ...TextFieldProps,
  autoFocus?: boolean
|}

export class FormField extends React.Component<Props> {
  static defaultProps = {
    autoCapitalize: 'none', // Native default is 'sentences'
    autoCorrect: false, // Native default is 'true'
    returnKeyType: 'go',
    keyboardType: 'default'
  }

  inputRef: { current: TextField | null } = React.createRef()

  componentDidMount() {
    if (this.props.autoFocus && this.inputRef.current != null) {
      this.inputRef.current.focus()
    }
  }

  render() {
    const { autoFocus, ...rest } = this.props
    return <TextField {...rest} ref={this.inputRef} />
  }
}

export const MaterialInputOnWhite = {
  containerStyle: {
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
