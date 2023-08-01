import * as React from 'react'
import { View } from 'react-native'

import { styled } from '../hoc/styled'
import { MainButton, MainButtonType } from '../themed/MainButton'

const BUTTON_MARGINS = [0.5, 0]

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
    return <MainButton label={label} onPress={onPress} type={type} marginRem={BUTTON_MARGINS} disabled={disabled} />
  }

  return (
    <StyledButtonContainer layout={layout}>
      {renderButton('primary', primary)}
      {renderButton('secondary', secondary)}
      {renderButton('escape', escape)}
    </StyledButtonContainer>
  )
})

const StyledButtonContainer = styled(View)<{ layout: 'row' | 'column' }>(theme => props => {
  const isRowLayout = props.layout === 'row'
  return {
    flexDirection: isRowLayout ? 'row-reverse' : 'column',
    justifyContent: 'space-evenly',
    margin: theme.rem(0.5),
    marginHorizontal: isRowLayout ? 0 : theme.rem(0.5)
  }
})
