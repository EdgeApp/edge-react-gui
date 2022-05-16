// @flow

import * as React from 'react'
import { I18nManager, StyleSheet, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  type AnimationCallback,
  type SharedValue,
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming
} from 'react-native-reanimated'

import { forwardRef, useImperativeHandle } from '../../types/reactHooks.js'

type Props = {|
  // The content to render in the row.
  // This will determine the row's overall dimensions.
  children?: React.Node,

  // Animation duration for the snapping and swiping actions:
  duration?: number,

  // The components to show under the row.
  // Sliding will only be possible in the directions where these are present.
  // These will be rendered inside an absolutely-positioned container,
  // so they receive the same dimensions as the row itself.
  renderLeft?: (isActive: SharedValue<boolean>) => React.Node,
  renderRight?: (isActive: SharedValue<boolean>) => React.Node,

  // The row will "snap" to these dimensions when released,
  // making it possible to interact with the components underneath.
  // Defaults to half the width. Set this to 0 if you don't want detents.
  leftDetent?: number,
  rightDetent?: number,

  // Sliding past these dimensions will cause the row's content
  // to fully retract to the edge, then trigger the action callback.
  // Defaults to half the width.
  leftThreshold?: number,
  rightThreshold?: number,

  // Actions triggered when sliding past the swipe threshold.
  onLeftSwipe?: () => void,
  onRightSwipe?: () => void
|}

/**
 * Type definitions for our static methods.
 * Create a ref object using `useRef<SwipableRowRef>(null)` or
 * `const ref: { current: SwipableRowRef | null } = createRef()`
 */
declare export class SwipableRowRef extends React.Component<Props> {
  // Snap the row to its resting position:
  close: () => void;

  // Snap the row to its detent position:
  openLeft: () => void;
  openRight: () => void;

  // Fully open the row:
  swipeLeft: () => void;
  swipeRight: () => void;
}

/**
 * A row that can be slid left or right to reveal underlying buttons.
 */
export const SwipeableRow: Class<SwipableRowRef> = forwardRef((props: Props, ref) => {
  // Tracks the width of the row:
  const width = useSharedValue(0)
  const handleLayout = event => {
    width.value = event.nativeEvent.layout.width
  }

  const {
    // Contents:
    children,
    renderLeft,
    renderRight,

    // Metrics:
    duration = 300,
    leftDetent = width.value / 2,
    rightDetent = width.value / 2,
    leftThreshold = width.value / 2,
    rightThreshold = width.value / 2,

    // Callbacks:
    onLeftSwipe = () => {},
    onRightSwipe = () => {}
  } = props

  const rtl = I18nManager.isRTL ? -1 : 1

  // Values driven by the pan gesture:
  const panStart = useSharedValue(0)
  const pan = useSharedValue(0)

  // Callback bouncers:
  const handleLeftSwipe: AnimationCallback = done => {
    'worklet'
    if (done) runOnJS(onLeftSwipe)()
  }
  const handleRightSwipe: AnimationCallback = done => {
    'worklet'
    if (done) runOnJS(onRightSwipe)()
  }

  // Imperative methods:
  useImperativeHandle(ref, () => ({
    close() {
      pan.value = withTiming(0, { duration })
    },
    openLeft() {
      pan.value = withSpring(rtl * leftDetent)
    },
    openRight() {
      pan.value = withSpring(-rtl * rightDetent)
    },
    swipeLeft() {
      pan.value = withTiming(rtl * width.value, { duration }, handleLeftSwipe)
    },
    swipeRight() {
      pan.value = withTiming(-rtl * width.value, { duration }, handleRightSwipe)
    }
  }))

  // Worklet-powered gesture responder:
  const canPanLeft = renderLeft !== undefined
  const canPanRight = renderRight !== undefined
  const panGesture = Gesture.Pan()
    .hitSlop({ right: -20 }) // To prevent grabbing the row when the user grab the side menu
    .activeOffsetX([-20, 20])
    .onBegin(e => {
      panStart.value = pan.value
    })
    .onUpdate(e => {
      let offset = panStart.value + e.translationX
      if (!canPanLeft && rtl * offset > 0) offset = 0
      if (!canPanRight && -rtl * offset > 0) offset = 0
      pan.value = offset
    })
    .onEnd(e => {
      if (-rtl * pan.value > rightThreshold) {
        // Swipe right:
        pan.value = withTiming(-rtl * width.value, { duration }, handleRightSwipe)
      } else if (rtl * pan.value > leftThreshold) {
        // Swipe left:
        pan.value = withTiming(rtl * width.value, { duration }, handleLeftSwipe)
      } else if (-rtl * pan.value > 0.5 * rightDetent) {
        // Open right:
        pan.value = withSpring(-rtl * rightDetent)
      } else if (rtl * pan.value > 0.5 * leftDetent) {
        // Open left:
        pan.value = withSpring(rtl * leftDetent)
      } else {
        // Close:
        pan.value = withTiming(0, { duration })
      }
    })

  // Derived flags:
  const leftActive = useDerivedValue(() => {
    return rtl * pan.value > leftThreshold
  })
  const rightActive = useDerivedValue(() => {
    return -rtl * pan.value > rightThreshold
  })

  // Derived styles:
  const leftStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: rtl * pan.value > 0 ? 0 : pan.value }]
  }))
  const rightStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -rtl * pan.value > 0 ? 0 : pan.value }]
  }))
  const childStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pan.value }]
  }))

  return (
    <GestureDetector gesture={panGesture}>
      <View style={styles.container} onLayout={handleLayout}>
        {renderLeft == null ? null : <Animated.View style={[styles.underlay, leftStyle]}>{renderLeft(leftActive)}</Animated.View>}
        {renderRight == null ? null : <Animated.View style={[styles.underlay, rightStyle]}>{renderRight(rightActive)}</Animated.View>}
        <Animated.View style={[styles.childContainer, childStyle]}>{children}</Animated.View>
      </View>
    </GestureDetector>
  )
})

const styles = StyleSheet.create({
  childContainer: {
    // Dummy style needed to avoid breakage.
  },
  container: {
    overflow: 'hidden'
  },
  underlay: {
    flexDirection: 'row',
    ...StyleSheet.absoluteFillObject
  }
})
