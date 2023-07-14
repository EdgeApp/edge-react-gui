import * as React from 'react'
import { View } from 'react-native'

import { styled } from '../hoc/styled'
import { MainButton, MainButtonType } from '../themed/MainButton'

export interface ButtonInfo {
  label: string
  onPress: () => void | Promise<void>
  disabled?: boolean
}

interface Props {
  primary?: ButtonInfo
  secondary?: ButtonInfo
  escape?: ButtonInfo
  layout: 'row' | 'column'
}

/**
 * A consistently styled view for displaying button layouts.
 */
export const ButtonsContainer = React.memo(({ primary, secondary, escape, layout = 'column' }: Props) => {
  const renderButton = (type: MainButtonType, buttonProps?: ButtonInfo) => {
    if (buttonProps == null) return null
    const { label, onPress, disabled } = buttonProps
    return <MainButton label={label} onPress={onPress} type={type} marginRem={0.5} disabled={disabled} />
  }

  return (
    <StyledButtonContainer layout={layout}>
      {renderButton('primary', primary)}
      {renderButton('secondary', secondary)}
      {renderButton('escape', escape)}
    </StyledButtonContainer>
  )
})

const StyledButtonContainer = styled(View)<{ layout: 'row' | 'column' }>(props => {
  return {
    flexDirection: props.layout === 'row' ? 'row-reverse' : 'column',
    justifyContent: 'space-between',
    padding: props.theme.rem(0.5),
    paddingHorizontal: props.theme.rem(1)
  }
})
