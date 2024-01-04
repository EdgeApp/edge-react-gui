import * as React from 'react'
import { View, ViewStyle } from 'react-native'
import Animated from 'react-native-reanimated'

import { useFadeAnimation } from '../../hooks/animations/useFadeAnimation'
import { styled } from '../hoc/styled'
import { Space } from '../layout/Space'
import { ButtonTypeUi4, ButtonUi4 } from './ButtonUi4'

const INTER_BUTTON_SPACING_REM = 1

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
    | 'column' // Buttons stacked on top of each other vertically, taking up as much space as the widest button.
    | 'solo' // A single centered button whose size is determined by label length (default for single-button props)

  // Extra bottom margins for scenes to allow scrolling up further into an
  // easier tap area of the screen
  sceneMargin?: boolean
}

/**
 * A consistently styled view for displaying button layouts.
 */
export const ButtonsViewUi4 = React.memo(({ absolute = false, fade, primary, secondary, secondary2, tertiary, layout = 'column', sceneMargin }: Props) => {
  const [fadeVisibleHack, setFadeVisibleHack] = React.useState(false)

  const numButtons = [primary, secondary, secondary2, tertiary].filter(key => key != null).length
  if (numButtons === 1) layout = 'solo'

  const fadeStyle = useFadeAnimation(fadeVisibleHack, { noFadeIn: fade == null })

  const spacing = <Space around={INTER_BUTTON_SPACING_REM / 2} />

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
      <StyledButtonContainer absolute={absolute} layout={layout} sceneMargin={sceneMargin}>
        {renderButton('primary', primary)}
        {primary != null && secondary != null ? spacing : null}
        {renderButton('secondary', secondary2)}
        {secondary != null && secondary2 != null ? spacing : null}
        {renderButton('secondary', secondary)}
        {tertiary != null ? spacing : null}
        {renderButton('tertiary', tertiary)}
      </StyledButtonContainer>
    </Animated.View>
  )
})

const StyledButtonContainer = styled(View)<{ absolute: boolean; layout: 'row' | 'column' | 'solo'; sceneMargin?: boolean }>(theme => props => {
  const { absolute, layout, sceneMargin } = props

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
          justifyContent: 'center'
        }
      : {}

  const columnStyle: ViewStyle =
    layout === 'column'
      ? {
          alignSelf: 'center', // Shrink view around buttons
          alignItems: 'stretch', // Stretch our children out
          flexDirection: 'column',
          // justifyContent: 'space-between',
          borderColor: '#ffffff30',
          borderWidth: 0.5
        }
      : {}

  const sceneMarginStyle: ViewStyle = sceneMargin
    ? {
        marginBottom: theme.rem(3),
        marginTop: theme.rem(1)
      }
    : {}

  return {
    ...baseStyle,
    ...absoluteStyle,
    ...soloStyle,
    ...rowStyle,
    ...columnStyle,
    ...sceneMarginStyle
  }
})
