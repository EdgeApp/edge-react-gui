// @flow

import React, { Component } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'

import { THEME } from '../../theme/variables/airbitz.js'
import { scale } from '../../util/scaling.js'
import { type AirshipBridge } from './Airship.js'
import { LayoutContext } from './LayoutContext.js'

const animationTime = 1000
const visibleTime = 2000

type Props = {
  bridge: AirshipBridge<void>,

  // The message to show in the toast:
  message?: string
}

/**
 * A semi-transparent message overlay.
 */
export class AirshipToast extends Component<Props> {
  opacity: Animated.Value

  constructor (props: Props) {
    super(props)
    this.opacity = new Animated.Value(0)
  }

  componentDidMount () {
    const { bridge } = this.props

    // Animate in:
    Animated.timing(this.opacity, {
      toValue: 0.9,
      duration: animationTime,
      useNativeDriver: true
    }).start()

    // Animate out:
    setTimeout(() => {
      bridge.resolve()
      Animated.timing(this.opacity, {
        toValue: 0,
        duration: animationTime,
        useNativeDriver: true
      }).start(() => bridge.remove())
    }, animationTime + visibleTime)
  }

  render () {
    const { message } = this.props

    return (
      <LayoutContext>
        {metrics => {
          const { safeAreaInsets } = metrics

          return (
            <View pointerEvents="none" touch style={[styles.screen, safeAreaInsets]}>
              <Animated.View style={[styles.body, { opacity: this.opacity }]}>
                <Text style={styles.text}>{message}</Text>
              </Animated.View>
            </View>
          )
        }}
      </LayoutContext>
    )
  }
}

const unit = scale(13)

const styles = StyleSheet.create({
  body: {
    // Layout:
    maxWidth: 32 * unit,
    marginBottom: 4 * unit,
    marginHorizontal: unit,

    // Visuals:
    backgroundColor: THEME.COLORS.GRAY_3,
    borderRadius: (3 / 2) * unit,

    // Children:
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    padding: unit
  },

  screen: {
    // Layout:
    position: 'absolute',

    // Children:
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'center'
  },

  text: {
    color: THEME.COLORS.BLACK,
    flexShrink: 1,
    fontFamily: THEME.FONTS.DEFAULT,
    fontSize: unit,
    textAlign: 'center'
  }
})
