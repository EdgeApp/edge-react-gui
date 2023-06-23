import * as React from 'react'
import { Dimensions } from 'react-native'
import { TextField, TextFieldProps } from 'react-native-material-textfield'

import { THEME } from '../../theme/variables/airbitz'

interface Props extends TextFieldProps {
  autoFocus?: boolean
}

export class FormField extends React.Component<Props> {
  static defaultProps = {
    autoCapitalize: 'none', // Native default is 'sentences'
    autoCorrect: false, // Native default is 'true'
    returnKeyType: 'go',
    keyboardType: 'default'
  }

  inputRef = React.createRef<TextField>()

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

const containerStyle = {
  position: 'relative',
  width: Dimensions.get('window').width / 1.52,
  height: 60
} as const

export const MaterialInputOnWhite = {
  containerStyle,
  baseColor: THEME.COLORS.PRIMARY,
  tintColor: THEME.COLORS.SECONDARY,
  errorColor: THEME.COLORS.ACCENT_RED,
  textColor: THEME.COLORS.BLACK,
  titleTextStyle: {
    // color: THEME.COLORS.PRIMARY // this causes the forms to have a default text color EVEN ON ERROR
  }
}
