// // @flow

// import * as React from 'react'
// import Animated from 'react-native-reanimated'

// import { useFadeAnimation } from '../../hooks/animations/useFadeAnimation'

// type Props = {
//   children?: React.Node,

//   // True to make the contents visible:
//   visible: boolean,

//   // Animation duration, in ms:
//   duration?: number,

//   // No fade in animation on first render:
//   noFadeIn?: boolean,

//   // Unmount component after fade out:
//   isUnmount?: boolean,

//   fadeInOpacity?: number,

//   fadeOutOpacity?: number,

//   style?: any
// }

// export const Fade = (props: Props) => {
//   const { children, duration = 500, visible, noFadeIn = false, fadeInOpacity = 1, fadeOutOpacity = 0, isUnmount = false, style } = props

//   const { animatedStyle, isRender } = useFadeAnimation(visible, { noFadeIn, duration, fadeInOpacity, fadeOutOpacity, isUnmount })

//   const isBlockedEvents = visible ? 'auto' : 'none'

//   const AnimatedView = (
//     <Animated.View style={[style, animatedStyle]} pointerEvents={isBlockedEvents}>
//       {children}
//     </Animated.View>
//   )

//   if (isUnmount) {
//     return isRender ? AnimatedView : null
//   }

//   return AnimatedView
// }
