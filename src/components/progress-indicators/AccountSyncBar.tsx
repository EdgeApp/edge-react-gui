import React from 'react'
import { View } from 'react-native'
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'

import { useAccountSyncRatio } from '../../hooks/useAccountSyncRatio'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'

/**
 * Shows a bar indicating the the number of wallets that are fully synced across
 * the entire account.
 */
export const AccountSyncBar = () => {
  const theme = useTheme()
  const style = getStyles(theme)

  // Calculate the average progress:
  const progress = useAccountSyncRatio()
  const animation = useSharedValue(progress)

  // Animation state:
  const [isProgressVisible, setIsProgressVisible] = React.useState(
    progress !== 100
  )

  React.useEffect(() => {
    if (progress === 1) {
      // Delay-hide the progress bar after reaching completion.
      setTimeout(() => {
        setIsProgressVisible(false)
      }, 2000)
    } else {
      // Re-show progress bar if overall sync state changes for whatever reason:
      // Added wallets, resynced wallets, unpaused wallets, etc.
      setIsProgressVisible(true)

      animation.value = withTiming(progress, { duration: 1500 })
    }
  }, [animation, progress])

  const widthStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scaleX: interpolate(animation.value, [0, 1], [0.1, 1], {
          extrapolateRight: 'clamp'
        })
      }
    ]
  }))

  if (!isProgressVisible) return null
  return (
    <View style={style.container}>
      <Animated.View style={[style.bar, widthStyle]} />
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    zIndex: 100,
    flexDirection: 'row'
  },
  bar: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    height: 3,
    backgroundColor: theme.walletProgressIconFill,
    transformOrigin: 'left center'
  }
}))
