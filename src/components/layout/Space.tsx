import * as React from 'react'
import { View } from 'react-native'

import { SpaceProps, useSpaceStyle } from '../../hooks/useSpaceStyle'

interface OwnProps {
  children?: React.ReactNode
}
type Props = OwnProps & SpaceProps

/**
 * Numbers are rem units, and boolean means to fill up assigned space; this
 * allows for centering and alignment (see useSpaceStyle hook for details).
 */
export const Space = React.memo((props: Props) => {
  const { children } = props
  const spaceStyle = useSpaceStyle(props)

  return <View style={spaceStyle}>{children}</View>
})
