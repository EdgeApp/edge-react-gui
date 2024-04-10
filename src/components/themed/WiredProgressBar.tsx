import React from 'react'
import { Animated, Easing, View } from 'react-native'

import { DONE_THRESHOLD } from '../../constants/WalletAndCurrencyConstants'
import { useWatch } from '../../hooks/useWatch'
import { useSelector } from '../../types/reactRedux'
import { isKeysOnlyPlugin } from '../../util/CurrencyInfoHelpers'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'

/**
 * Shows a bar indicating the the number of wallets that are fully synced across
 * the entire account.
 */
export const WiredProgressBar = () => {
  const theme = useTheme()
  const style = getStyles(theme)

  const account = useSelector(state => state.core.account)
  const userPausedWalletsSet = useSelector(state => state.ui.settings.userPausedWalletsSet)

  const currencyWallets = useWatch(account, 'currencyWallets')
  const currencyWalletErrors = useWatch(account, 'currencyWalletErrors')

  const [progress, setProgress] = React.useState(0)
  const [isProgressVisible, setIsProgressVisible] = React.useState(progress !== 100)

  const animation = React.useRef(new Animated.Value(progress)).current

  const syncableWalletIds = Object.keys(currencyWallets).filter(walletId => {
    const wallet = currencyWallets[walletId]
    const isKeysOnly = isKeysOnlyPlugin(wallet.currencyInfo.pluginId)
    const isPaused = userPausedWalletsSet != null && userPausedWalletsSet.has(walletId)
    return !isKeysOnly && !isPaused
  })

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

  React.useEffect(() => {
    // Function to update progress based on current wallet states
    const updateProgress = () => {
      const syncedWallets = syncableWalletIds.filter(walletId => {
        const wallet = currencyWallets[walletId]

        return (
          // Count the number of wallets that are fully synced,
          wallet.syncRatio > DONE_THRESHOLD ||
          // Including crashed wallets, too
          currencyWalletErrors[walletId] != null
        )
      }).length

      const newProgress = syncableWalletIds.length === 0 ? 100 : (syncedWallets / syncableWalletIds.length) * 100
      setProgress(newProgress)
    }

    // Call updateProgress initially
    updateProgress()

    // Set up listeners for each wallet's syncRatio
    const unsubscribers = syncableWalletIds.map(walletId => {
      const wallet = currencyWallets[walletId]
      return wallet.watch('syncRatio', updateProgress)
    })

    // Clean up listeners when component unmounts or dependencies change
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe())
    }
  }, [currencyWallets, currencyWalletErrors, syncableWalletIds])

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
