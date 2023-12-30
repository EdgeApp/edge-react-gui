import * as React from 'react'
import { View, ViewStyle } from 'react-native'
import Animated from 'react-native-reanimated'

import { useFadeAnimation } from '../../hooks/animations/useFadeAnimation'
import { styled } from '../hoc/styled'
import { ButtonTypeUi4, ButtonUi4 } from './ButtonUi4'

export interface ButtonInfo {
  label: string
  onPress: () => void | Promise<void>
  disabled?: boolean
}

interface Props {
  // Specifies whether the component should be positioned absolutely.
  // Default value is false.
  absolute?: boolean

  // If specified, fades visibility according to the value of fade.
  // The component is always visible if fade is unset.
  fade?: boolean

  // ButtonInfos
  primary?: ButtonInfo
  secondary?: ButtonInfo
  secondary2?: ButtonInfo // A secondary-styled button in the primary position (right/top side)
  tertiary?: ButtonInfo

  // Arrangement of the button(s). Defaults to 'column' or 'solo' depending on
  // number of ButtonInfos given
  layout?:
    | 'row' // Buttons are stacked side by side horizontally, taking up 50% of the available space each.
    | 'column' // Buttons stacked on top of each other vertically, taking up 100% of the available space each. TODO: Consider doing something fancier like measuring the longest label width instead of always 100% each (default for mutli-button props)
    | 'solo' // A single centered button whose size is determined by label length (default for single-button props)
}

/**
 * A consistently styled view for displaying button layouts.
 */
export const ButtonsViewUi4 = React.memo(({ absolute = false, fade, primary, secondary, secondary2, tertiary, layout = 'column' }: Props) => {
  const [fadeVisibleHack, setFadeVisibleHack] = React.useState(false)

  const numButtons = [primary, secondary, secondary2, tertiary].filter(key => key != null).length
  if (numButtons === 1) layout = 'solo'

  const fadeStyle = useFadeAnimation(fadeVisibleHack, { noFadeIn: fade == null })

  const renderButton = (type: ButtonTypeUi4, buttonProps?: ButtonInfo) => {
    if (buttonProps == null) return null
    const { label, onPress, disabled } = buttonProps
    return <ButtonUi4 layout={layout} label={label} onPress={onPress} type={type} disabled={disabled} />
  }

  // HACK: Workaround for useFadeAnimation not working if visible=true is set
  // immediately
  React.useEffect(() => {
    setFadeVisibleHack(fade == null ? true : fade)
  }, [fade])

  return (
    <Animated.View style={fadeStyle}>
      <StyledButtonContainer absolute={absolute} layout={layout}>
        {renderButton('primary', primary)}
        {renderButton('secondary', secondary2)}
        {renderButton('secondary', secondary)}
        {renderButton('tertiary', tertiary)}
      </StyledButtonContainer>
    </Animated.View>
  )
})

const StyledButtonContainer = styled(View)<{ absolute: boolean; layout: 'row' | 'column' | 'solo' }>(theme => props => {
  const { absolute, layout } = props

  const marginSize = theme.rem(0.5)

  const baseStyle: ViewStyle = {
    margin: marginSize
  }

  const absoluteStyle: ViewStyle = absolute
    ? {
        position: 'absolute',
        bottom: 0,
        left: marginSize,
        right: marginSize
      }
    : {}

  const soloStyle: ViewStyle =
    layout === 'solo'
      ? {
          justifyContent: 'center',
          marginHorizontal: theme.rem(0.5),
          alignItems: 'center',
          flex: 1
        }
      : {}

  const rowStyle: ViewStyle =
    layout === 'row'
      ? {
          flex: 1,
          flexDirection: 'row-reverse',
          justifyContent: 'center',
          marginHorizontal: 0
        }
      : {}

  const columnStyle: ViewStyle =
    layout === 'column'
      ? {
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: theme.rem(3) // Extra padding to allow scrolling the buttons further from the hard-to-tap bottom edge
        }
      : {}

  return {
    ...baseStyle,
    ...absoluteStyle,
    ...soloStyle,
    ...rowStyle,
    ...columnStyle
  }
})
