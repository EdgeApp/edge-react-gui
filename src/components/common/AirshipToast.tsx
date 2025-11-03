import * as React from 'react'
import { Animated } from 'react-native'
import type { AirshipBridge } from 'react-native-airship'

import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

interface Props {
  bridge: AirshipBridge<void>
  children?: React.ReactNode

  autoHideMs?: number
  // The message to show in the toast, before any other children:
  message: string
}

const DEFAULT_AUTO_HIDE_MS = 3000

export const AirshipToast: React.FC<Props> = props => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { autoHideMs = DEFAULT_AUTO_HIDE_MS, bridge, children, message } = props
  // Opacity values are inlined in the animations below

  // Animation state:
  const opacity = React.useRef(new Animated.Value(0)).current

  React.useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined

    // Animate in:
    Animated.timing(opacity, {
      toValue: 0.9,
      duration: 300,
      useNativeDriver: true
    }).start(() => {
      if (autoHideMs > 0) {
        timeout = setTimeout(() => {
          timeout = undefined
          bridge.resolve(undefined)
        }, autoHideMs)
      }
    })

    // Animate out:
    const offClear = bridge.on('clear', () => {
      bridge.resolve(undefined)
    })
    const offResult = bridge.on('result', () => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true
      }).start(() => {
        bridge.remove()
      })
    })

    return () => {
      if (timeout != null) clearTimeout(timeout)
      offClear()
      offResult()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Animated.View style={[styles.body, { opacity }]}>
      {message != null ? (
        <EdgeText style={styles.text} numberOfLines={0}>
          {message}
        </EdgeText>
      ) : null}
      {children}
    </Animated.View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  body: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: theme.toastBackground,
    borderRadius: theme.rem(0.5),
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginHorizontal: theme.rem(1),
    marginBottom: theme.rem(4),
    padding: theme.rem(0.8)
  },
  text: {
    color: theme.toastText,
    flexShrink: 1,
    fontSize: theme.rem(0.8),
    textAlign: 'center'
  }
}))
