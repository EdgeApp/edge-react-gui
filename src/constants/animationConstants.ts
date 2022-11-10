import { Easing, FadeInDown, FadeInLeft, FadeInRight, FadeInUp, FadeOutDown, FadeOutLeft, FadeOutRight, Layout, ZoomIn, ZoomOut } from 'react-native-reanimated'

export const LAYOUT_ANIMATION = Layout.duration(500).easing(Easing.inOut(Easing.quad))
export const ENTER_ANIMATION = ZoomIn.duration(500).easing(Easing.inOut(Easing.quad))
export const EXIT_ANIMATION = ZoomOut.duration(500).easing(Easing.inOut(Easing.quad))
export const BALANCE_BOX_ENTER_ANIMATION = FadeInUp.duration(500).easing(Easing.inOut(Easing.quad))
export const BALANCE_BOX_EXIT_ANIMATION = FadeOutDown.duration(350).easing(Easing.inOut(Easing.quad))
export const WALLET_LIST_HEADER_ENTER_ANIMATION = FadeInDown.duration(500).easing(Easing.inOut(Easing.quad))
export const RIGHT_BALANCE_LAYOUT_ANIMATION = Layout.duration(350).easing(Easing.inOut(Easing.quad))
export const RIGHT_BALANCE_ENTER_ANIMATION = (delay: number = 0) => FadeInRight.duration(350).delay(delay).easing(Easing.inOut(Easing.quad))
export const RIGHT_BALANCE_EXIT_ANIMATION = (delay: number = 0) => FadeOutRight.duration(350).delay(delay).easing(Easing.inOut(Easing.quad))
export const WALLET_ENTER_ANIMATION = (delay: number = 0) => FadeInLeft.duration(350).delay(delay).easing(Easing.inOut(Easing.quad))
export const WALLET_EXIT_ANIMATION = (delay: number = 0) => FadeOutLeft.duration(350).delay(delay).easing(Easing.inOut(Easing.quad))
