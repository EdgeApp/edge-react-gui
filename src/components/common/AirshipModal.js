// @flow

import React, { type Node, Component } from 'react'
import { Animated, BackHandler, Dimensions, StyleSheet, TouchableWithoutFeedback } from 'react-native'
import { type AirshipBridge } from 'react-native-airship'

import { THEME } from '../../theme/variables/airbitz.js'
import { scale } from '../../util/scaling.js'
import { KeyboardTracker } from './KeyboardTracker.js'
import { type SafeAreaGap, LayoutContext } from './LayoutContext.js'

type Props = {
  bridge: AirshipBridge<any>,
  children: Node | ((gap: SafeAreaGap) => Node),

  // True to have the modal float in the center of the screen,
  // or false for a bottom modal:
  center?: boolean,

  // Called when the user taps outside the modal or clicks the back button:
  onCancel: () => mixed
}

/**
 * A modal that slides a modal up from the bottom of the screen
 * and dims the rest of the app.
 */
export class AirshipModal extends Component<Props> {
  backHandler: { remove(): mixed } | void
  opacity: Animated.Value
  offset: Animated.Value

  constructor (props: Props) {
    super(props)
    this.opacity = new Animated.Value(0)
    this.offset = new Animated.Value(Dimensions.get('window').height)
  }

  componentDidMount () {
    this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      this.props.onCancel()
      return true
    })

    // Animate in:
    Animated.parallel([
      Animated.timing(this.opacity, {
        toValue: 0.7,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.timing(this.offset, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      })
    ]).start()

    // Animate out:
    this.props.bridge.onResult(() =>
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
      ]).start(this.props.bridge.remove)
    )
  }

  componentWillUnmount () {
    if (this.backHandler) this.backHandler.remove()
  }

  render () {
    return (
      <LayoutContext>
        {metrics => {
          const { layout, safeAreaInsets } = metrics
          const downValue = safeAreaInsets.bottom
          const upValue = keyboardHeight => Math.max(keyboardHeight, downValue)

          return (
            <KeyboardTracker downValue={downValue} upValue={upValue}>
              {(keyboardAnimation, keyboardLayout) => this.renderModal(layout.height, safeAreaInsets, keyboardAnimation, keyboardLayout)}
            </KeyboardTracker>
          )
        }}
      </LayoutContext>
    )
  }

  /**
   * Draws the actual visual elements, given the current layout information:
   */
  renderModal (height: number, gap: SafeAreaGap, keyboardAnimation: Animated.Value, keyboardLayout: number) {
    const { children, center } = this.props

    // Set up the dynamic CSS values:
    const screenPadding = {
      paddingBottom: keyboardAnimation,
      paddingLeft: gap.left,
      paddingRight: gap.right,
      paddingTop: gap.top
    }
    const transform = [{ translateY: this.offset }]
    const bodyStyle = center
      ? [styles.centerBody, { transform }]
      : [
        styles.bottomBody,
        {
          marginBottom: -keyboardLayout,
          maxHeight: keyboardLayout + 0.75 * (height - gap.bottom - gap.top),
          paddingBottom: keyboardLayout,
          transform
        }
      ]

    return (
      <Animated.View style={[styles.screen, screenPadding]}>
        <TouchableWithoutFeedback onPress={() => this.props.onCancel()}>
          <Animated.View style={[styles.darkness, { opacity: this.opacity }]} />
        </TouchableWithoutFeedback>
        <Animated.View style={bodyStyle}>
          {typeof children === 'function'
            ? children({
              bottom: center ? 0 : keyboardLayout,
              left: 0,
              right: 0,
              top: 0
            })
            : children}
        </Animated.View>
      </Animated.View>
    )
  }
}

const borderRadius = scale(16)
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
    ...commonBody,

    // Layout:
    alignSelf: 'flex-end',

    // Visuals:
    borderTopLeftRadius: borderRadius,
    borderTopRightRadius: borderRadius
  },

  centerBody: {
    ...commonBody,

    // Layout:
    alignSelf: 'center',
    marginHorizontal: scale(12),

    // Visuals:
    borderRadius: borderRadius
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
  },

  screen: {
    // Layout:
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,

    // Children:
    flexDirection: 'row',
    justifyContent: 'center'
  }
})
