import React from 'react'
import { StyleSheet } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import {
  type LayoutStyleProps,
  useLayoutStyle
} from '../../hooks/useLayoutStyle'
import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { cacheStyles, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

export interface PillButtonProps extends LayoutStyleProps {
  label: string
  onPress: () => void | Promise<void>
  icon?: () => React.ReactElement | null
  disabled?: boolean
}

export const PillButton: React.FC<PillButtonProps> = (
  props: PillButtonProps
) => {
  const { label, onPress, icon, disabled = false, ...marginProps } = props
  const marginStyle = useLayoutStyle(marginProps)

  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <EdgeTouchableOpacity
      style={[styles.container, marginStyle]}
      disabled={disabled}
      hitSlop={theme.rem(0.5)}
      onPress={onPress}
    >
      <LinearGradient
        style={styles.gradient}
        colors={
          disabled ? theme.secondaryButtonDisabled : theme.secondaryButton
        }
        end={theme.secondaryButtonColorEnd}
        start={theme.secondaryButtonColorStart}
      />
      {icon == null ? null : icon()}
      <EdgeText
        style={styles.label}
        disableFontScaling
        ellipsizeMode="tail"
        numberOfLines={1}
      >
        {label}
      </EdgeText>
    </EdgeTouchableOpacity>
  )
}

const getStyles = cacheStyles((theme: ReturnType<typeof useTheme>) => ({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: theme.rem(0.75),
    paddingVertical: theme.rem(0.25),
    gap: theme.rem(0.5),
    flexShrink: 1,
    minWidth: 0,
    margin: theme.rem(0.5)
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: theme.rem(3)
  },
  label: {
    fontSize: theme.rem(0.75),
    lineHeight: theme.rem(1.5),
    flexShrink: 1,
    minWidth: 0
  }
}))
