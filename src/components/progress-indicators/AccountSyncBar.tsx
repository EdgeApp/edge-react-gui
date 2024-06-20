import React from 'react'
import { Animated, Easing, View } from 'react-native'

import { useAccountWalletsSyncProgress } from '../../hooks/useAccountWalletsSyncProgress'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'

/**
 * Shows a bar indicating the the number of wallets that are fully synced across
 * the entire account.
 */
export const AccountSyncBar = () => {
  const theme = useTheme()
  const style = getStyles(theme)

  // Calculate the average progress:
  const progress = useAccountWalletsSyncProgress()

  // Animation state:
  const [isProgressVisible, setIsProgressVisible] = React.useState(progress !== 100)
  const animation = React.useRef(new Animated.Value(progress)).current

  const widthInterpolated = animation.interpolate({
    inputRange: [0, 100],
    outputRange: ['10%', '100%'],
    extrapolate: 'clamp'
  })

  React.useEffect(() => {
    if (progress === 100) {
      // Delay-hide the progress bar after reaching completion.
      setTimeout(() => {
        setIsProgressVisible(false)
      }, 2000)
    } else {
      // Re-show progress bar if overall sync state changes for whatever reason:
      // Added wallets, resynced wallets, unpaused wallets, etc.
      setIsProgressVisible(true)

      Animated.timing(animation, {
        duration: 1500,
        easing: Easing.ease,
        toValue: progress,
        useNativeDriver: false
      }).start()
    }
  }, [animation, progress])

  if (!isProgressVisible) return null

  return (
    <View style={style.container}>
      <Animated.View style={[style.bar, { width: widthInterpolated }]} />
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
    backgroundColor: theme.walletProgressIconFill
  }
}))
