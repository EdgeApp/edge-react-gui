import React from 'react'
import LinearGradient from 'react-native-linear-gradient'

import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { styled } from '../hoc/styled'
import { useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

export interface PillButtonProps {
  label: string
  onPress: () => void | Promise<void>
  icon?: () => React.ReactElement | null
  disabled?: boolean
}

export const PillButton = (props: PillButtonProps): React.ReactElement => {
  const { label, onPress, icon, disabled = false } = props

  const theme = useTheme()

  return (
    <EdgeTouchableOpacity onPress={onPress} disabled={disabled}>
      <Gradient
        colors={
          disabled ? theme.secondaryButtonDisabled : theme.secondaryButton
        }
        end={theme.secondaryButtonColorEnd}
        start={theme.secondaryButtonColorStart}
      >
        {icon == null ? null : icon()}
        <Label>{label}</Label>
      </Gradient>
    </EdgeTouchableOpacity>
  )
}

const Gradient = styled(LinearGradient)(theme => ({
  alignItems: 'center',
  borderRadius: theme.rem(100),
  flexDirection: 'row',
  paddingHorizontal: theme.rem(0.75),
  paddingVertical: theme.rem(0.25),
  gap: theme.rem(0.5)
}))

const Label = styled(EdgeText)(theme => ({
  fontSize: theme.rem(0.75),
  lineHeight: theme.rem(1.5)
}))
