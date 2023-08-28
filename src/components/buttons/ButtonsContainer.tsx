import * as React from 'react'
import { View } from 'react-native'
import Animated from 'react-native-reanimated'

import { useFadeAnimation } from '../../hooks/animations/useFadeAnimation'
import { styled } from '../hoc/styled'
import { MainButton, MainButtonType } from '../themed/MainButton'

const BUTTON_MARGINS = [0.5, 0]

export interface ButtonInfo {
  label: string
  onPress: () => void | Promise<void>
  disabled?: boolean
}

interface Props {
  absolute?: boolean
  fade?: boolean
  primary?: ButtonInfo
  secondary?: ButtonInfo
  escape?: ButtonInfo
  layout: 'row' | 'column'
}

/**
 * A consistently styled view for displaying button layouts.
 */
export const ButtonsContainer = React.memo(({ absolute = false, fade = false, primary, secondary, escape, layout = 'column' }: Props) => {
  const [fadeVisibleHack, setFadeVisibleHack] = React.useState(false)

  const fadeStyle = useFadeAnimation(fadeVisibleHack, { noFadeIn: !fade })

  const renderButton = (type: MainButtonType, buttonProps?: ButtonInfo) => {
    if (buttonProps == null) return null
    const { label, onPress, disabled } = buttonProps
    return <MainButton label={label} onPress={onPress} type={type} marginRem={BUTTON_MARGINS} disabled={disabled} />
  }

  // HACK: Workaround for useFadeAnimation not working if visible=true is set
  // immediately
  React.useEffect(() => {
    setFadeVisibleHack(true)
  }, [fade])

  return (
    <StyledButtonContainer absolute={absolute} layout={layout}>
      <Animated.View style={fadeStyle}>
        {renderButton('primary', primary)}
        {renderButton('secondary', secondary)}
        {renderButton('escape', escape)}
      </Animated.View>
    </StyledButtonContainer>
  )
})

const StyledButtonContainer = styled(View)<{ absolute: boolean; layout: 'row' | 'column' }>(theme => props => {
  const isRowLayout = props.layout === 'row'
  return {
    position: props.absolute ? 'absolute' : undefined,
    bottom: props.absolute ? 0 : undefined,
    left: props.absolute ? theme.rem(0.5) : undefined,
    right: props.absolute ? theme.rem(0.5) : undefined,
    flexDirection: isRowLayout ? 'row-reverse' : 'column',
    justifyContent: 'space-evenly',
    margin: theme.rem(0.5),
    marginHorizontal: isRowLayout ? 0 : theme.rem(0.5)
  }
})
