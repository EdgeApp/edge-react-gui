import React from 'react'
import { Animated, Easing, View } from 'react-native'

import { useSelector } from '../../types/reactRedux'
import { isKeysOnlyPlugin } from '../../util/CurrencyInfoHelpers'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'

const SHOW_UNSYNCED = false
const SHOW_UNSYNCED_RATIO = 0.9

export const WiredProgressBar = () => {
  const progress = useSelector(state => {
    const { userPausedWalletsSet } = state.ui.settings
    const walletsForProgress = state.ui.wallets.walletLoadingProgress
    const walletIds = Object.keys(walletsForProgress)
    if (walletIds.length === 0) return 0

    let sum = 0
    let numPausedWallets = 0
    const unsyncedWallets: Array<{
      id: string
      name: string
      plugin: string
    }> = []
    for (const walletId of walletIds) {
      const wallet = state.core.account.currencyWallets[walletId]
      if (wallet == null) return 0

      const paused = userPausedWalletsSet?.has(walletId)
      const keysOnly = isKeysOnlyPlugin(wallet.currencyInfo.pluginId)

      if (paused === true || keysOnly) {
        numPausedWallets++
        continue
      }

      sum += walletsForProgress[walletId]
      if (walletsForProgress[walletId] !== 1) {
        unsyncedWallets.push({
          id: walletId,
          plugin: wallet.currencyInfo.pluginId,
          name: wallet.name ?? 'NO_NAME'
        })
      }
    }
    const numRunningWallets = walletIds.length - numPausedWallets

    let ratio = sum / numRunningWallets
    if (ratio > 0.99999) ratio = 1

    if (SHOW_UNSYNCED && ratio > SHOW_UNSYNCED_RATIO) {
      console.log(`PROGRESS: ${sum}/${numRunningWallets} = ${ratio}`)
      for (const w of unsyncedWallets) {
        const { id, plugin, name } = w
        console.log(`UNSYNCED: ${plugin} ${name} ${id.slice(0, 5)}`)
      }
    }
    return ratio * 100
  })

  const [isWalletProgressVisible, setIsWalletProgressVisible] = React.useState(progress !== 100)
  const animation = React.useRef(new Animated.Value(progress)).current

  const theme = useTheme()
  const style = getStyles(theme)

  const widthInterpolated = animation.interpolate({
    inputRange: [0, 100],
    outputRange: ['10%', '100%'],
    extrapolate: 'clamp'
  })

  React.useEffect(() => {
    if (progress === 100) {
      setTimeout(() => {
        setIsWalletProgressVisible(false)
      }, 2000)
    } else {
      Animated.timing(animation, {
        duration: 1500,
        easing: Easing.ease,
        toValue: progress,
        useNativeDriver: false
      }).start()
    }
  }, [animation, progress])

  if (!isWalletProgressVisible) return null

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
