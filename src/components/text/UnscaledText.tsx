import * as React from 'react'
import { Text, type TextProps } from 'react-native'

import { minimumFontSizeProps } from '../themed/EdgeText'

export const UnscaledText: React.FC<TextProps> = props => {
  const { adjustsFontSizeToFit = false, minimumFontScale, style } = props
  // Give the new architecture the shrink floor it otherwise ignores:
  const floor =
    adjustsFontSizeToFit && minimumFontScale != null
      ? minimumFontSizeProps(style, minimumFontScale, 14)
      : {}
  return <Text allowFontScaling={false} {...props} {...floor} />
}
