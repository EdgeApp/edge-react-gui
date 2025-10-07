import * as React from 'react'
import Ionicon from 'react-native-vector-icons/Ionicons'

import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { cacheStyles, useTheme } from '../services/ThemeContext'

export interface DropdownInputButtonProps {
  children: React.ReactNode
  onPress: () => void | Promise<void>
  testID?: string
}

export const DropdownInputButton: React.FC<DropdownInputButtonProps> = (
  props: DropdownInputButtonProps
) => {
  const { children, onPress, testID } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <EdgeTouchableOpacity
      style={styles.container}
      onPress={onPress}
      testID={testID}
    >
      {children}
      <Ionicon
        name="chevron-down"
        size={theme.rem(1)}
        color={theme.iconTappable}
      />
    </EdgeTouchableOpacity>
  )
}

const getStyles = cacheStyles((theme: ReturnType<typeof useTheme>) => ({
  container: {
    backgroundColor: theme.textInputBackgroundColor,
    borderRadius: theme.rem(0.5),
    padding: theme.rem(1),
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.rem(0.25),
    minWidth: theme.rem(4),
    height: theme.rem(3.25)
  }
}))
