import * as React from 'react'
import { Animated, Dimensions, StyleSheet, TouchableWithoutFeedback, View } from 'react-native'
import { AirshipBridge, Unsubscribe } from 'react-native-airship'

import { THEME } from '../../theme/variables/airbitz'
import { LayoutContext } from './LayoutContext'

const slideInTime = 300
const slideOutTime = 500

interface Props {
  bridge: AirshipBridge<void>
  children: React.ReactNode

  backgroundColor: string

  // Determines how long the dropdown remains visible,
  // or 0 to disable auto-hide:
  autoHideMs?: number

  // Called when the user taps anywhere in the dropdown.
  // Defaults to hiding the dropdown.
  onPress?: () => unknown
}

/**
 * A notification that slides down from the top of the screen.
 */
export class AirshipDropdown extends React.Component<Props> {
  offset: Animated.Value
  timeout: ReturnType<typeof setTimeout> | undefined
  unclear: Unsubscribe | undefined
  unresult: Unsubscribe | undefined

  constructor(props: Props) {
    super(props)
    this.offset = new Animated.Value(this.hiddenOffset())
  }

  hiddenOffset() {
    return -Dimensions.get('window').height / 4
  }

  componentDidMount() {
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
          this.timeout = undefined
          bridge.resolve()
        }, autoHideMs)
      }
    })

    // Animate out:
    this.unclear = bridge.on('clear', bridge.resolve)
    this.unresult = bridge.on('result', () => {
      if (this.timeout != null) clearTimeout(this.timeout)
      Animated.timing(this.offset, {
        toValue: this.hiddenOffset(),
        duration: slideOutTime,
        useNativeDriver: true
      }).start(() => bridge.remove())
    })
  }

  componentWillUnmount() {
    if (this.unclear != null) this.unclear()
    if (this.unresult != null) this.unresult()
  }

  render() {
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
            <View pointerEvents="box-none" style={[styles.screen, screenStyle]}>
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
      height: 0,
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
