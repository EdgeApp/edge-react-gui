import * as React from 'react'
import { View } from 'react-native'

interface Props {
  children?: React.ReactNode
  isShown: boolean
}

export const Peek: React.FC<Props> = props => {
  const { children, isShown } = props
  const opacity = isShown ? 1 : 0

  return <View style={{ opacity }}>{children}</View>
}
