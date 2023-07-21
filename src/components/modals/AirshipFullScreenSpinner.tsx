import * as React from 'react'
import { ActivityIndicator, Animated, StyleSheet, Text, View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'

import { THEME } from '../../theme/variables/airbitz'
import { scale } from '../../util/scaling'
import { Airship } from '../services/AirshipInstance'

/**
 * Shows a message & activity spinner on a fullscreen backdrop, tied to the lifetime of a promise.
 * No touches will be registed at it's lifetime.
 */
export async function showFullScreenSpinner<T>(message: string, promise: Promise<T>): Promise<T> {
  return await Airship.show(bridge => <AirshipFullScreenSpinner bridge={bridge} message={message} activity={promise} />)
}

const fadeInTime = 300
const fadeOutTime = 1000
const visibleTime = 3000

interface Props<T> {
  bridge: AirshipBridge<T>
  // The message to show in the toast:
  message?: string
  // If set, the toast will stay up for the lifetime of the promise,
  // and will include a spinner.
  activity?: Promise<T>
}

export class AirshipFullScreenSpinner<T> extends React.Component<Props<T>> {
  opacity: Animated.Value

  constructor(props: Props<T>) {
    super(props)
    this.opacity = new Animated.Value(0)
  }

  componentDidMount() {
    const { activity, bridge } = this.props

    // Animate in:
    Animated.timing(this.opacity, {
      toValue: 0.9,
      duration: fadeInTime,
      useNativeDriver: true
    }).start()

    const hide = () => {
      // Animate out:
      Animated.timing(this.opacity, {
        toValue: 0,
        duration: fadeOutTime,
        useNativeDriver: true
      }).start(() => bridge.remove())
    }

    if (activity != null) {
      activity
        .then(result => bridge.resolve(result))
        .catch(error => bridge.reject(error))
        .finally(() => {
          hide()
        })
    } else {
      setTimeout(hide, fadeInTime + visibleTime)
    }
  }

  render() {
    return (
      <Animated.View style={[styles.container, { opacity: this.opacity }]}>
        <View style={styles.darkness} />
        <View style={styles.body}>{this.renderContent()}</View>
      </Animated.View>
    )
  }

  renderContent() {
    const { activity, message } = this.props
    if (activity == null) return <Text style={styles.text}>{message}</Text>

    return (
      <>
        <Text style={[styles.text, { marginRight: unit }]}>{message}</Text>
        <ActivityIndicator color={THEME.COLORS.ACCENT_MINT} />
      </>
    )
  }
}

const unit = scale(13)

const styles = StyleSheet.create({
  body: {
    // Layout:
    maxWidth: 32 * unit,

    // Visuals:
    backgroundColor: THEME.COLORS.GRAY_3,
    borderRadius: (3 / 2) * unit,

    // Children:
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    padding: unit
  },

  container: {
    // Layout:
    padding: unit,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,

    // Children:
    alignItems: 'center',
    flexDirection: 'column',
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
    backgroundColor: THEME.COLORS.SHADOW,
    opacity: THEME.OPACITY.MODAL_DARKNESS
  },

  text: {
    color: THEME.COLORS.BLACK,
    flexShrink: 1,
    fontFamily: THEME.FONTS.DEFAULT,
    fontSize: unit,
    textAlign: 'center'
  }
})
