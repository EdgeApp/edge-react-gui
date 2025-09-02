import * as React from 'react'
import { TextInput, type TextInputProps } from 'react-native'

export const UnscaledTextInput = React.forwardRef<TextInput, TextInputProps>(
  (props, ref) => {
    return <TextInput ref={ref} allowFontScaling={false} {...props} />
  }
)
