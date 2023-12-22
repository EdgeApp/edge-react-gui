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

  // Row or column button layout. Defaults to column layout.
  layout: 'row' | 'column'
}

/**
 * A consistently styled view for displaying button layouts.
 */
export const ButtonsViewUi4 = React.memo(({ absolute = false, fade, primary, secondary, secondary2, tertiary, layout = 'column' }: Props) => {
  const [fadeVisibleHack, setFadeVisibleHack] = React.useState(false)

  const fadeStyle = useFadeAnimation(fadeVisibleHack, { noFadeIn: fade == null })

  const renderButton = (type: ButtonTypeUi4, buttonProps?: ButtonInfo) => {
    if (buttonProps == null) return null
    const { label, onPress, disabled } = buttonProps
    return <ButtonUi4 label={label} onPress={onPress} type={type} disabled={disabled} />
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

const StyledButtonContainer = styled(View)<{ absolute: boolean; layout: 'row' | 'column' }>(theme => props => {
  const { absolute, layout } = props
  const isRowLayout = layout === 'row'

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

  const rowStyle: ViewStyle = isRowLayout
    ? {
        flex: 1,
        flexDirection: 'row-reverse',
        justifyContent: 'center',
        marginHorizontal: 0
      }
    : {}

  const columnStyle: ViewStyle = !isRowLayout
    ? {
        flexDirection: 'column',
        justifyContent: 'space-between'
      }
    : {}

  return {
    ...baseStyle,
    ...absoluteStyle,
    ...rowStyle,
    ...columnStyle
  }
})
