// @flow

import React, { type ChildrenArray, Component, type Node } from 'react'
import { Animated, Dimensions, StyleSheet, TouchableWithoutFeedback, View } from 'react-native'

import { scale } from '../../lib/scaling.js'
import THEME from '../../theme/variables/airbitz.js'
import { type AirshipBallast } from './Airship.js'
import { KeyboardTracker } from './KeyboardTracker'
import { LayoutContext } from './LayoutContext.js'
import { type SceneGap } from './SceneWrapper.js'

// Should be ChildrenArray<Node>, but Flow is too old to understand:
type NodeArray = Array<Node> | Node

type BottomModalProps = {
  children: NodeArray | ((gapBottom: number) => NodeArray),
  bridge: AirshipBallast,
  onCancel: () => mixed
}

/**
 * A modal that stays attached to the bottom of the screen.
 */
export function AirshipBottomModal (props: BottomModalProps) {
  const { bridge, children, onCancel } = props

  return (
    <AirshipModalAnimation bridge={bridge} onCancel={onCancel}>
      {(transform, gap) => (
        <Animated.View
          style={[
            styles.bottomBody,
            {
              marginBottom: -gap.bottom,
              paddingBottom: gap.bottom,
              transform
            }
          ]}
        >
          {typeof children === 'function' ? children(gap.bottom) : children}
        </Animated.View>
      )}
    </AirshipModalAnimation>
  )
}

type CenterModalProps = {
  children: NodeArray,
  bridge: AirshipBallast,
  onCancel: () => mixed
}

/**
 * A modal that is centered in the screen.
 */
export function AirshipCenterModal (props: CenterModalProps) {
  const { bridge, children, onCancel } = props

  return (
    <AirshipModalAnimation bridge={bridge} onCancel={onCancel}>
      {(transform, gap) => <Animated.View style={[styles.centerBody, { transform }]}>{children}</Animated.View>}
    </AirshipModalAnimation>
  )
}

/**
 * Place this inside a modal to get an offset circle for holding an icon.
 */
export function IconCircle (props: { children: ChildrenArray<Node> }) {
  return <View style={styles.iconCircle}>{props.children}</View>
}

type ModalAnimationProps = {
  children: (transform: Array<Object>, gap: SceneGap) => NodeArray,

  bridge: AirshipBallast,
  onCancel: () => mixed // Called when backdrop is pressed
}

/**
 * Slides a modal up from the bottom of the screen, with a dark background.
 */
export class AirshipModalAnimation extends Component<ModalAnimationProps> {
  // Fade in / out animation:
  opacity: Animated.Value
  offset: Animated.Value

  constructor (props: ModalAnimationProps) {
    super(props)

    // Set up entry / exit animations:
    this.opacity = new Animated.Value(0)
    this.offset = new Animated.Value(Dimensions.get('window').height)

    // Animate out:
    props.bridge.onResult(() =>
      Animated.parallel([
        Animated.timing(this.opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.timing(this.offset, {
          toValue: Dimensions.get('window').height,
          duration: 300,
          useNativeDriver: true
        })
      ]).start(props.bridge.remove)
    )
  }

  componentDidMount () {
    // Animate in;
    Animated.parallel([
      Animated.timing(this.opacity, {
        toValue: 0.7,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.timing(this.offset, {
        toValue: 0,
        duration: 300,
        // duration: 1500,
        // easing: Easing.bounce,
        useNativeDriver: true
      })
    ]).start()
  }

  render () {
    const { children } = this.props

    return (
      <LayoutContext>
        {({ safeAreaInsets }) => (
          <KeyboardTracker downValue={safeAreaInsets.bottom} upValue={keyboardHeight => Math.max(safeAreaInsets.bottom, keyboardHeight)}>
            {(animation, keyboardHeight) => {
              const gap = {
                ...safeAreaInsets,
                bottom: Math.max(safeAreaInsets.bottom, keyboardHeight)
              }

              return (
                <Animated.View
                  style={[
                    styles.hover,
                    {
                      paddingBottom: animation,
                      paddingLeft: gap.left,
                      paddingRight: gap.right,
                      paddingTop: gap.top
                    }
                  ]}
                >
                  <TouchableWithoutFeedback onPress={() => this.props.onCancel()}>
                    <Animated.View style={[styles.darkness, { opacity: this.opacity }]} />
                  </TouchableWithoutFeedback>
                  {children([{ translateY: this.offset }], gap)}
                </Animated.View>
              )
            }}
          </KeyboardTracker>
        )}
      </LayoutContext>
    )
  }
}

const iconSize = scale(64)
const borderRadius = scale(4)
const commonBody = {
  // Layout:
  flexShrink: 1,
  width: 500,

  // Visuals:
  backgroundColor: THEME.COLORS.WHITE,
  shadowOpacity: 1,
  shadowOffset: {
    width: 0,
    height: scale(2)
  },
  shadowRadius: scale(4),

  // Children:
  alignItems: 'stretch',
  flexDirection: 'column',
  justifyContent: 'flex-start'
}

const styles = StyleSheet.create({
  bottomBody: {
    // Layout:
    alignSelf: 'flex-end',
    marginLeft: -scale(4),
    marginRight: -scale(4),
    marginTop: '25%',

    // Visuals:
    borderTopLeftRadius: borderRadius,
    borderTopRightRadius: borderRadius,

    ...commonBody
  },

  centerBody: {
    // Layout:
    alignSelf: 'center',
    marginLeft: scale(12),
    marginRight: scale(12),

    // Visuals:
    borderRadius: borderRadius,

    ...commonBody
  },

  iconCircle: {
    // Layout:
    alignSelf: 'center',
    marginTop: -iconSize / 2,
    height: iconSize,
    width: iconSize,

    // Visuals:
    backgroundColor: THEME.COLORS.WHITE,
    borderColor: THEME.COLORS.SECONDARY,
    borderRadius: iconSize / 2,
    borderWidth: scale(4),

    // Children:
    alignItems: 'center',
    justifyContent: 'center'
  },

  hover: {
    // Layout:
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,

    // Children:
    flexDirection: 'row',
    justifyContent: 'center'
  },

  darkness: {
    // Layout:
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,

    // Visuals:
    backgroundColor: THEME.COLORS.BLACK
  }
})
