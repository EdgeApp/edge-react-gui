import * as React from 'react'
import { View, ViewStyle } from 'react-native'

import { SpaceProps, useSpaceStyle } from '../../hooks/useSpaceStyle'

interface OwnProps {
  children?: React.ReactNode
  style?: ViewStyle
}
type Props = OwnProps & SpaceProps

export const Space = React.memo((props: Props) => {
  const { children, style } = props
  const spaceStyle = useSpaceStyle(props)

  return <View style={[spaceStyle, style]}>{children}</View>
})
