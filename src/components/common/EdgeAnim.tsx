import * as React from 'react'
import { ViewProps } from 'react-native'
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
import { matchJson } from '../../util/matchJson'

export const DEFAULT_ANIMATION_DURATION_MS = 300
export const LAYOUT_ANIMATION = LinearTransition.duration(DEFAULT_ANIMATION_DURATION_MS)
export const MAX_LIST_ITEMS_ANIM = 10

// Commonly used enter/exit animations. Use these to prevent
// dynamically created objects as params that cause a re-render
export const fadeIn: Anim = { type: 'fadeIn' }
export const fadeInUp: Anim = { type: 'fadeInUp' }
export const fadeInUp20: Anim = { type: 'fadeInUp', distance: 20 }
export const fadeInUp25: Anim = { type: 'fadeInUp', distance: 25 }
export const fadeInUp30: Anim = { type: 'fadeInUp', distance: 30 }
export const fadeInUp40: Anim = { type: 'fadeInUp', distance: 40 }
export const fadeInUp50: Anim = { type: 'fadeInUp', distance: 50 }
export const fadeInUp60: Anim = { type: 'fadeInUp', distance: 60 }
export const fadeInUp80: Anim = { type: 'fadeInUp', distance: 80 }
export const fadeInUp90: Anim = { type: 'fadeInUp', distance: 90 }
export const fadeInUp110: Anim = { type: 'fadeInUp', distance: 110 }
export const fadeInUp120: Anim = { type: 'fadeInUp', distance: 120 }
export const fadeInUp140: Anim = { type: 'fadeInUp', distance: 140 }
export const fadeInDown: Anim = { type: 'fadeInDown' }
export const fadeInDown10: Anim = { type: 'fadeInDown', distance: 10 }
export const fadeInDown20: Anim = { type: 'fadeInDown', distance: 20 }
export const fadeInDown30: Anim = { type: 'fadeInDown', distance: 30 }
export const fadeInDown40: Anim = { type: 'fadeInDown', distance: 40 }
export const fadeInDown50: Anim = { type: 'fadeInDown', distance: 50 }
export const fadeInDown60: Anim = { type: 'fadeInDown', distance: 60 }
export const fadeInDown75: Anim = { type: 'fadeInDown', distance: 75 }
export const fadeInDown80: Anim = { type: 'fadeInDown', distance: 80 }
export const fadeInDown90: Anim = { type: 'fadeInDown', distance: 90 }
export const fadeInDown110: Anim = { type: 'fadeInDown', distance: 110 }
export const fadeInDown120: Anim = { type: 'fadeInDown', distance: 120 }
export const fadeInDown140: Anim = { type: 'fadeInDown', distance: 140 }
export const fadeInLeft: Anim = { type: 'fadeInLeft' }
export const fadeInRight: Anim = { type: 'fadeInRight' }

export const fadeOut: Anim = { type: 'fadeOut' }

type AnimBuilder = typeof ComplexAnimationBuilder
type AnimTypeFadeIns = 'fadeIn' | 'fadeInDown' | 'fadeInUp' | 'fadeInLeft' | 'fadeInRight'
type AnimTypeFadeOuts = 'fadeOut' | 'fadeOutDown' | 'fadeOutUp' | 'fadeOutLeft' | 'fadeOutRight'
type AnimTypeStretchIns = 'stretchInY'
type AnimTypeStretchOuts = 'stretchOutY'
type AnimType = AnimTypeFadeIns | AnimTypeFadeOuts | AnimTypeStretchIns | AnimTypeStretchOuts

export interface Anim {
  type: AnimType
  delay?: number
  duration?: number
  distance?: number
}

interface Props {
  disableAnimation?: boolean
  enter?: Anim
  exit?: Anim

  visible?: boolean

  children?: ViewProps['children']
  style?: ViewProps['style']
  accessible?: ViewProps['accessible']
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

const EdgeAnimInner = ({ children, disableAnimation, enter, exit, visible = true, ...rest }: Props): JSX.Element | null => {
  if (!visible) return null
  const entering = getAnimBuilder(enter)
  const exiting = getAnimBuilder(exit)
  const { disableAnimations } = getDeviceSettings()

  if (disableAnimations || disableAnimation) {
    return <Animated.View {...rest}>{children}</Animated.View>
  }

  return (
    <Animated.View layout={LAYOUT_ANIMATION} entering={entering} exiting={exiting} {...rest}>
      {children}
    </Animated.View>
  )
}

const edgeAnimPropsAreEqual = (prevProps: Props, nextProps: Props): boolean => {
  const { children: prevChildren, ...prevRest } = prevProps
  const { children: nextChildren, ...nextRest } = nextProps
  if (
    prevRest.accessible !== nextRest.accessible ||
    prevRest.visible !== nextRest.visible ||
    prevRest.disableAnimation !== nextRest.disableAnimation ||
    prevChildren !== nextChildren
  ) {
    return false
  }
  if (prevRest.style !== nextRest.style || prevRest.enter !== nextRest.enter || prevRest.exit !== nextRest.exit) {
    return matchJson(prevRest, nextRest)
  }
  return true
}
export const EdgeAnim = React.memo(EdgeAnimInner, edgeAnimPropsAreEqual)
