/**
 * IMPORTANT: Changes in this file MUST be synced between edge-react-gui and
 * edge-login-ui-rn!
 */

import * as React from 'react'
import { Platform, View, ViewStyle } from 'react-native'

import { EdgeAnim } from '../common/EdgeAnim'
import { maybeComponent } from '../hoc/maybeComponent'
import { styled } from '../hoc/styled'
import { Space } from '../layout/Space'
import { EdgeButton, EdgeButtonType } from './EdgeButton'

const INTER_BUTTON_SPACING_REM = 1
const ANIM_DURATION = 1000
const ANIM_DISTANCE_INCREMENT = 20

export interface ButtonInfo {
  label: string
  onPress: () => void | Promise<void>
  disabled?: boolean
  spinner?: boolean
  testID?: string

  animDistanceStart?: number
}

export interface ButtonsViewProps {
  // Specifies whether the component should be positioned absolutely.
  // Default value is false.
  absolute?: boolean
  // ButtonInfos
  primary?: ButtonInfo
  secondary?: ButtonInfo
  /** @deprecated - Create a separate component instead for these weird one-off cases */
  secondary2?: ButtonInfo // A secondary-styled button in the primary position (right/top side)
  tertiary?: ButtonInfo

  // Arrangement of the button(s). Defaults to 'column' or 'solo' depending on
  // number of ButtonInfos given
  layout?:
    | 'row' // Buttons are stacked side by side horizontally, taking up 50% of the available space each.
    | 'column' // Buttons stacked on top of each other vertically, taking up as much space as the widest button.
    /** @deprecated - Create `SoloButton` instead */
    | 'solo' // A single centered button whose size is determined by label length (default for single-button props)

  /** @deprecated Start just creating new components instead of extending this prop. Previously: What kind of component this ButtonsView lives on. Affects margins. */
  parentType?: 'scene' | 'modal'

  // 'distance' prop of the first button
  animDistanceStart?: number
}

/**
 * A consistently styled view for displaying button layouts.
 */
export const ButtonsView = React.memo(
  ({ absolute = false, primary, secondary, secondary2, tertiary, layout, parentType, animDistanceStart }: ButtonsViewProps) => {
    const buttonInfos = [primary, secondary, secondary2, tertiary].filter(key => key != null)
    if (layout == null) {
      layout = buttonInfos.length === 1 ? 'solo' : 'column'
    }
    const spacing = <Space aroundRem={INTER_BUTTON_SPACING_REM / 2} />

    const renderButton = (type: EdgeButtonType, buttonProps?: ButtonInfo, index: number = 0) => {
      if (buttonProps == null) return null
      const { label, onPress, disabled, spinner, testID } = buttonProps

      const distance = animDistanceStart != null ? animDistanceStart + index * ANIM_DISTANCE_INCREMENT : undefined
      // TODO: Sync EdgeAnim w/ LoginUi
      const disableAnimation = Platform.OS === 'android'

      return (
        <MaybeEdgeAnim when={animDistanceStart != null} disableAnimation={disableAnimation} enter={{ type: 'fadeInDown', duration: ANIM_DURATION, distance }}>
          <EdgeButton layout={layout} label={label} onPress={onPress} type={type} disabled={disabled} spinner={spinner} testID={testID} />
        </MaybeEdgeAnim>
      )
    }

    const hasPrimary = primary != null
    const hasSecondary = secondary != null
    const hasSecondary2 = secondary2 != null
    const hasTertiary = tertiary != null

    return (
      <StyledButtonContainer absolute={absolute} layout={layout} parentType={parentType}>
        {hasPrimary && (
          <>
            {renderButton('primary', primary, 0)}
            {(hasSecondary || hasSecondary2 || hasTertiary) && spacing}
          </>
        )}
        {hasSecondary && (
          <>
            {renderButton('secondary', secondary, hasPrimary ? 1 : 0)}
            {(hasSecondary2 || hasTertiary) && spacing}
          </>
        )}
        {hasSecondary2 && (
          <>
            {renderButton('secondary', secondary2, (hasPrimary ? 1 : 0) + (hasSecondary ? 1 : 0))}
            {hasTertiary && spacing}
          </>
        )}
        {hasTertiary && <>{renderButton('tertiary', tertiary, (hasPrimary ? 1 : 0) + (hasSecondary ? 1 : 0) + (hasSecondary2 ? 1 : 0))}</>}
      </StyledButtonContainer>
    )
  }
)

/** @deprecated - Shouldn't use this export post-UI4 transition once all our layouts have been codified into button layout components. */
export const StyledButtonContainer = styled(View)<{
  absolute?: boolean
  layout: 'row' | 'column' | 'solo'
  parentType?: 'scene' | 'modal'
}>(theme => props => {
  const { absolute, layout, parentType } = props

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

  /** @deprecated Instead of a soloStyle case here, create a separate `SoloButton` component */
  const soloStyle: ViewStyle =
    layout === 'solo'
      ? {
          justifyContent: 'center',
          marginHorizontal: theme.rem(0.5),
          alignItems: 'center',
          // TODO: This causes too much space in AddressModal.
          // Move flex to sceneMarginStyle, use in AddressModal, sync w/ LoginUi
          flexGrow: 1,
          flexShrink: 1
        }
      : {}

  const rowStyle: ViewStyle =
    layout === 'row'
      ? {
          flexGrow: 1,
          flexShrink: 1,
          flexDirection: 'row-reverse',
          justifyContent: 'center'
        }
      : {}

  const columnStyle: ViewStyle =
    layout === 'column'
      ? {
          alignSelf: 'center', // Shrink view around buttons
          alignItems: 'stretch', // Stretch our children out
          flexDirection: 'column'
        }
      : {}

  const sceneMarginStyle: ViewStyle =
    parentType === 'scene'
      ? {
          flexGrow: 1,
          flexShrink: 0,
          justifyContent: 'flex-end',
          marginBottom: theme.rem(3),
          marginTop: theme.rem(1)
        }
      : {}

  const modalMarginStyle: ViewStyle =
    parentType === 'modal'
      ? {
          marginBottom: theme.rem(1),
          marginTop: theme.rem(2)
        }
      : {}

  return {
    ...baseStyle,
    ...absoluteStyle,
    ...soloStyle,
    ...rowStyle,
    ...columnStyle,
    ...sceneMarginStyle,
    ...modalMarginStyle
  }
})

const MaybeEdgeAnim = maybeComponent(EdgeAnim)
