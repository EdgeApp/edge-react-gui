import { Easing, FadeInDown, FadeInLeft, FadeInRight, FadeInUp, FadeOutDown, FadeOutRight, Layout, ZoomIn, ZoomOut } from 'react-native-reanimated'

const MAX_RANDOM_DELAY_MS = 200
const DEFAULT_ANIMATION_DURATION_MS = 500
const SHORT_ANIMATION_DURATION_MS = 350

export const LAYOUT_ANIMATION = Layout.duration(DEFAULT_ANIMATION_DURATION_MS).easing(Easing.inOut(Easing.quad))
export const BALANCE_BOX_ENTER_ANIMATION = FadeInUp.duration(DEFAULT_ANIMATION_DURATION_MS).easing(Easing.inOut(Easing.quad))
export const BALANCE_BOX_EXIT_ANIMATION = FadeOutDown.duration(DEFAULT_ANIMATION_DURATION_MS).easing(Easing.inOut(Easing.quad))
export const zoomInAnimation = (delay: number = Math.random() * MAX_RANDOM_DELAY_MS) =>
  ZoomIn.delay(delay).duration(SHORT_ANIMATION_DURATION_MS).easing(Easing.inOut(Easing.quad))
export const zoomOutAnimation = (delay: number = Math.random() * MAX_RANDOM_DELAY_MS) =>
  ZoomOut.delay(delay).duration(SHORT_ANIMATION_DURATION_MS).easing(Easing.inOut(Easing.quad))
export const fadeInRightAnimation = (delay: number = Math.random() * MAX_RANDOM_DELAY_MS) =>
  FadeInRight.delay(delay).duration(SHORT_ANIMATION_DURATION_MS).easing(Easing.inOut(Easing.quad))
export const fadeOutRightAnimation = (delay: number = Math.random() * MAX_RANDOM_DELAY_MS) =>
  FadeOutRight.delay(delay).duration(SHORT_ANIMATION_DURATION_MS).easing(Easing.inOut(Easing.quad))
export const fadeInLeftAnimation = (delay: number = Math.random() * MAX_RANDOM_DELAY_MS) =>
  FadeInLeft.delay(delay).duration(SHORT_ANIMATION_DURATION_MS).easing(Easing.inOut(Easing.quad))
export const fadeInDownAnimation = (delay: number = Math.random() * MAX_RANDOM_DELAY_MS) =>
  FadeInDown.delay(delay).duration(SHORT_ANIMATION_DURATION_MS).easing(Easing.inOut(Easing.quad))
