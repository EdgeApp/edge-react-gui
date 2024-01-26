import * as React from 'react'
import { View, ViewProps } from 'react-native'
import Animated, {
  ComplexAnimationBuilder,
  Easing,
  FadeIn,
  FadeInDown,
  FadeInLeft,
  FadeInRight,
  FadeInUp,
  FadeOut,
  FadeOutDown,
  FadeOutLeft,
  FadeOutRight,
  FadeOutUp,
  LinearTransition,
  StretchInY,
  StretchOutY
} from 'react-native-reanimated'

import { getDeviceSettings } from '../../actions/DeviceSettingsActions'

export const DEFAULT_ANIMATION_DURATION_MS = 300
export const LAYOUT_ANIMATION = LinearTransition.duration(DEFAULT_ANIMATION_DURATION_MS)
export const MAX_LIST_ITEMS_ANIM = 10

type AnimBuilder = typeof ComplexAnimationBuilder
type AnimTypeFadeIns = 'fadeIn' | 'fadeInDown' | 'fadeInUp' | 'fadeInLeft' | 'fadeInRight'
type AnimTypeFadeOuts = 'fadeOut' | 'fadeOutDown' | 'fadeOutUp' | 'fadeOutLeft' | 'fadeOutRight'
type AnimTypeStretchIns = 'stretchInY'
type AnimTypeStretchOuts = 'stretchOutY'
type AnimType = AnimTypeFadeIns | AnimTypeFadeOuts | AnimTypeStretchIns | AnimTypeStretchOuts

interface Anim {
  type: AnimType
  delay?: number
  duration?: number
  distance?: number
}

interface Props extends ViewProps {
  /**
   * disable animation
   * anim => disable animation but still render a container view
   * view => render the children with no container view
   * */
  disableType?: 'anim' | 'view'
  enter?: Anim
  exit?: Anim

  visible?: boolean
}

const builderMap: Record<AnimType, AnimBuilder> = {
  fadeIn: FadeIn,
  fadeInDown: FadeInDown,
  fadeInUp: FadeInUp,
  fadeInLeft: FadeInLeft,
  fadeInRight: FadeInRight,
  fadeOut: FadeOut,
  fadeOutDown: FadeOutDown,
  fadeOutUp: FadeOutUp,
  fadeOutLeft: FadeOutLeft,
  fadeOutRight: FadeOutRight,
  stretchInY: StretchInY,
  stretchOutY: StretchOutY
}

const getAnimBuilder = (anim?: Anim) => {
  if (anim == null) return
  const { type, delay = 0, duration = DEFAULT_ANIMATION_DURATION_MS, distance } = anim
  const animBuilder = builderMap[type]

  let builder = animBuilder.delay(delay).duration(duration).easing(Easing.inOut(Easing.quad))

  // Allow initialValue distance for fadeIn transitions only as we
  // can only specify an initial value. fadeOut transitions would
  // need to specify a "final" value which we can't do
  if (distance != null && type.includes('In')) {
    // For fadeInLeft and fadeInUp, initialValues need to be negative
    const translateDistance = type.endsWith('Left') || type.endsWith('Up') ? -distance : distance
    if (type.endsWith('Left') || type.endsWith('Right')) {
      builder = builder.withInitialValues({
        transform: [{ translateX: translateDistance }]
      })
    } else {
      builder = builder.withInitialValues({
        transform: [{ translateY: translateDistance }]
      })
    }
  }
  return builder
}

export const EdgeAnim = ({ children, disableType, enter, exit, visible = true, ...rest }: Props): JSX.Element | null => {
  if (!visible) return null
  const entering = getAnimBuilder(enter)
  const exiting = getAnimBuilder(exit)
  const { disableAnimations } = getDeviceSettings()

  if (disableAnimations) {
    return <View {...rest}>{children}</View>
  }

  if (disableType === 'anim') {
    return <Animated.View {...rest}>{children}</Animated.View>
  }

  if (disableType === 'view') {
    return <>{children}</>
  }

  return (
    <Animated.View layout={LAYOUT_ANIMATION} entering={entering} exiting={exiting} {...rest}>
      {children}
    </Animated.View>
  )
}
