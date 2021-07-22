// @flow

import * as React from 'react'
import { StyleSheet } from 'react-native'
import Animated from 'react-native-reanimated'

import { useFide } from '../../util/hooks'

type Props = { children?: React.Node, style?: StyleSheet.Styles, isFideIn: boolean }

const Fide = ({ children, style, isFideIn }: Props) => {
  const { animatedStyle, isRender } = useFide(isFideIn, 0.8)

  return isRender ? <Animated.View style={[style, animatedStyle]}>{children}</Animated.View> : null
}

export default Fide
