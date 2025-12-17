import * as React from 'react'

import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { ChevronDownIcon } from '../icons/ThemedIcons'
import { cacheStyles, useTheme } from '../services/ThemeContext'

export interface DropdownInputButtonProps {
  children: React.ReactNode
  onPress?: () => void | Promise<void>
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
      disabled={onPress == null}
      testID={testID}
    >
      {children}
      {onPress != null ? (
      <ChevronDownIcon size={theme.rem(1)} color={theme.iconTappable} />
      ) : null}
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
