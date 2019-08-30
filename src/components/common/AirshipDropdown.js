// @flow

import React, { Component, type Node } from 'react'
import { Animated, Dimensions, StyleSheet, TouchableWithoutFeedback, View } from 'react-native'

import { THEME } from '../../theme/variables/airbitz.js'
import { type AirshipBridge } from './Airship.js'
import { LayoutContext } from './LayoutContext.js'

const slideInTime = 300
const slideOutTime = 500

type Props = {
  bridge: AirshipBridge<void>,
  children: Node,

  backgroundColor: string,

  // Determines how long the dropdown remains visible,
  // or 0 to disable auto-hide:
  autoHideMs?: number,

  // Called when the user taps anywhere in the dropdown.
  // Defaults to hiding the dropdown.
  onPress?: () => mixed
}

/**
 * A notification that slides down from the top of the screen.
 */
export class AirshipDropdown extends Component<Props> {
  offset: Animated.Value
  timeout: TimeoutID | void

  constructor (props: Props) {
    super(props)
    this.offset = new Animated.Value(this.hiddenOffset())
  }

  hiddenOffset () {
    return -Dimensions.get('window').height / 4
  }

  componentDidMount () {
    const { bridge, autoHideMs = 5000 } = this.props

    // Animate in:
    Animated.timing(this.offset, {
      toValue: 0,
      duration: slideInTime,
      useNativeDriver: true
    }).start(() => {
      // Start the auto-hide timer:
      if (autoHideMs) {
        this.timeout = setTimeout(() => {
          this.timeout = void 0
          bridge.resolve()
        }, autoHideMs)
      }
    })

    // Animate out:
    bridge.onResult(() => {
      if (this.timeout != null) clearTimeout(this.timeout)
      Animated.timing(this.offset, {
        toValue: this.hiddenOffset(),
        duration: slideOutTime,
        useNativeDriver: true
      }).start(() => bridge.remove())
    })
  }

  render () {
    const { bridge, children, backgroundColor, onPress = () => bridge.resolve() } = this.props

    return (
      <LayoutContext>
        {metrics => {
          const { safeAreaInsets } = metrics

          const screenStyle = {
            bottom: safeAreaInsets.bottom,
            left: safeAreaInsets.left,
            right: safeAreaInsets.right,
            top: 0
          }
          const bodyStyle = {
            backgroundColor,
            paddingTop: safeAreaInsets.top,
            transform: [{ translateY: this.offset }]
          }

          return (
            <View pointerEvents="box-none" touch style={[styles.screen, screenStyle]}>
              <TouchableWithoutFeedback onPress={onPress}>
                <Animated.View style={[styles.body, bodyStyle]}>{children}</Animated.View>
              </TouchableWithoutFeedback>
            </View>
          )
        }}
      </LayoutContext>
    )
  }
}

const borderRadius = THEME.rem(1 / 4)

const styles = StyleSheet.create({
  body: {
    // Layout:
    flexShrink: 1,
    width: THEME.rem(32),

    // Visuals:
    borderBottomLeftRadius: borderRadius,
    borderBottomRightRadius: borderRadius,
    shadowOpacity: 1,
    shadowOffset: {
      width: 0
    },
    shadowRadius: THEME.rem(1 / 4),

    // Children:
    alignItems: 'stretch',
    flexDirection: 'column',
    justifyContent: 'flex-start'
  },

  screen: {
    // Layout:
    position: 'absolute',

    // Children:
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'center'
  }
})
