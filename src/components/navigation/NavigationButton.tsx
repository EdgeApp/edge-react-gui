import { getDefaultHeaderHeight } from '@react-navigation/elements'
import * as React from 'react'
import { TouchableOpacity, ViewStyle } from 'react-native'
import { useSafeAreaFrame } from 'react-native-safe-area-context'

import { fixSides, mapSides, sidesToPadding } from '../../util/sides'
import { useTheme } from '../services/ThemeContext'

interface Props {
  children: React.ReactNode
  paddingRem?: number[] | number
  onPress: () => void
}

/**
 * A touchable element to place in the top navigation header.
 * Place a child element, such as an icon or text element in here.
 */
export const NavigationButton = (props: Props) => {
  const { children, paddingRem: marginRem, onPress } = props
  const theme = useTheme()

  const frame = useSafeAreaFrame()
  const touchableStyle = React.useMemo<ViewStyle>(
    () => ({
      alignItems: 'center',
      flexDirection: 'row',
      height: getDefaultHeaderHeight(frame, false, 0),
      justifyContent: 'center',
      ...sidesToPadding(mapSides(fixSides(marginRem, 0), theme.rem))
    }),
    [frame, marginRem, theme.rem]
  )

  return (
    <TouchableOpacity accessible={false} style={touchableStyle} onPress={onPress}>
      {children}
    </TouchableOpacity>
  )
}
