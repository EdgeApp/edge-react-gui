// @flow

import React, { Component, Fragment } from 'react'
import { ActivityIndicator, Animated, StyleSheet, Text, View } from 'react-native'
import { type AirshipBridge } from 'react-native-airship'

import { THEME } from '../../theme/variables/airbitz.js'
import { scale } from '../../util/scaling.js'
import { LayoutContext } from './LayoutContext.js'

const fadeInTime = 300
const fadeOutTime = 1000
const visibleTime = 3000

type Props = {
  bridge: AirshipBridge<void>,

  // The message to show in the toast:
  message?: string,

  // If set, the toast will stay up for the lifetime of the promise,
  // and will include a spinner.
  activity?: Promise<mixed>
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
    const { activity, bridge } = this.props

    // Animate in:
    Animated.timing(this.opacity, {
      toValue: 0.9,
      duration: fadeInTime,
      useNativeDriver: true
    }).start()

    // Animate out:
    const hide = () => {
      bridge.resolve()
      Animated.timing(this.opacity, {
        toValue: 0,
        duration: fadeOutTime,
        useNativeDriver: true
      }).start(() => bridge.remove())
    }
    if (activity != null) {
      activity.then(hide, hide)
    } else {
      setTimeout(hide, fadeInTime + visibleTime)
    }
  }

  render () {
    return (
      <LayoutContext>
        {metrics => {
          const { safeAreaInsets } = metrics

          return (
            <View pointerEvents="none" touch style={[styles.screen, safeAreaInsets]}>
              <Animated.View style={[styles.body, { opacity: this.opacity }]}>{this.renderContent()}</Animated.View>
            </View>
          )
        }}
      </LayoutContext>
    )
  }

  renderContent () {
    const { activity, message } = this.props
    if (activity == null) return <Text style={styles.text}>{message}</Text>

    return (
      <Fragment>
        <Text style={[styles.text, { marginRight: unit }]}>{message}</Text>
        <ActivityIndicator />
      </Fragment>
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
