import React from 'react'
import { View } from 'react-native'

import { styled } from '../hoc/styled'
import { EdgeText } from '../themed/EdgeText'
import { EdgeButton } from './EdgeButton'

export interface PillButtonProps {
  label: string
  onPress: () => void | Promise<void>
  icon?: () => React.ReactElement | null
  disabled?: boolean
}

export const PillButton: React.FC<PillButtonProps> = (
  props: PillButtonProps
) => {
  const { label, onPress, icon, disabled = false } = props

  return (
    <EdgeButton
      type="secondary"
      mini
      layout="column"
      onPress={onPress}
      disabled={disabled}
      paddingRem={[0.25, 0.75]}
    >
      <RowView>
        {icon == null ? null : icon()}
        <LabelText>{label}</LabelText>
      </RowView>
    </EdgeButton>
  )
}

const LabelText = styled(EdgeText)(theme => ({
  fontSize: theme.rem(0.8),
  lineHeight: theme.rem(1.5)
}))

const RowView = styled(View)(theme => ({
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'row',
  gap: theme.rem(0.25)
}))
