// @flow

import * as React from 'react'
import { type StyleSheet, View } from 'react-native'

import { type SpaceProps, useSpaceStyle } from '../../hooks/useSpaceStyle'
import { memo } from '../../types/reactHooks'

type OwnProps = {
  children?: React.Node,
  style?: StyleSheet.Style
}
type Props = OwnProps & SpaceProps

export const Space = memo((props: Props) => {
  const { children, style } = props
  const spaceStyle = useSpaceStyle(props)

  return <View style={[spaceStyle, style]}>{children}</View>
})
