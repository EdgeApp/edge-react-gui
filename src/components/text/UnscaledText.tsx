import * as React from 'react'
import { Text, type TextProps } from 'react-native'
import Animated, { type AnimatedProps } from 'react-native-reanimated'

export const UnscaledText: React.FC<TextProps> = props => {
  return <Text allowFontScaling={false} {...props} />
}

export const AnimatedUnscaledText: React.FC<
  AnimatedProps<TextProps>
> = props => {
  return <Animated.Text allowFontScaling={false} {...props} />
}
