import * as React from 'react'
import { StyleSheet, View } from 'react-native'

import { SpaceProps, useSpaceStyle } from '../../hooks/useSpaceStyle'
import { memo } from '../../types/reactHooks'

type OwnProps = {
  children?: React.ReactNode
  // @ts-expect-error
  style?: StyleSheet.Style
}
type Props = OwnProps & SpaceProps

export const Space = memo((props: Props) => {
  const { children, style } = props
  const spaceStyle = useSpaceStyle(props)

  return <View style={[spaceStyle, style]}>{children}</View>
})
