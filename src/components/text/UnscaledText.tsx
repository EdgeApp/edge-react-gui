import * as React from 'react'
import { Text, type TextProps } from 'react-native'

import {
  DEFAULT_MINIMUM_FONT_SCALE,
  minimumFontSizeProps
} from '../themed/EdgeText'

// React Native's default Text font size, for styles that set none:
const RN_DEFAULT_FONT_SIZE = 14

export const UnscaledText: React.FC<TextProps> = props => {
  const {
    adjustsFontSizeToFit = false,
    minimumFontScale = DEFAULT_MINIMUM_FONT_SCALE,
    style
  } = props
  // Fabric ignores `minimumFontScale`, so also pass it as an absolute
  // `minimumFontSize` floor (see `patches/react-native+0.86.0.patch`):
  const floorProps = adjustsFontSizeToFit
    ? minimumFontSizeProps(style, minimumFontScale, RN_DEFAULT_FONT_SIZE)
    : null
  return (
    <Text
      allowFontScaling={false}
      {...props}
      minimumFontScale={minimumFontScale}
      {...floorProps}
    />
  )
}
