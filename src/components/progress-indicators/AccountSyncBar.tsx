import { EdgeAccount } from 'edge-core-js'
import React from 'react'
import { Animated, Easing, View } from 'react-native'

import { DONE_THRESHOLD } from '../../constants/WalletAndCurrencyConstants'
import { useWalletsSubscriber } from '../../hooks/useWalletsSubscriber'
import { useWatch } from '../../hooks/useWatch'
import { useSelector } from '../../types/reactRedux'
import { isKeysOnlyPlugin } from '../../util/CurrencyInfoHelpers'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'

/**
 * Shows a bar indicating the the number of wallets that are fully synced across
 * the entire account.
 */
export const AccountSyncBar = () => {
  const theme = useTheme()
  const style = getStyles(theme)

  const account = useSelector(state => state.core.account)
  const userPausedWalletsSet = useSelector(state => state.ui.settings.userPausedWalletsSet)

  const currencyWallets = useWatch(account, 'currencyWallets')
  const currencyWalletErrors = useWatch(account, 'currencyWalletErrors')

  // Track the progress of all wallets:
  const [progressMap, setProgressMap] = React.useState(() => {
    const out = new Map<string, number>()
    for (const walletId of Object.keys(currencyWallets)) {
      const wallet = currencyWallets[walletId]
      out.set(wallet.id, wallet.syncRatio)
    }
    return out
  })

  useWalletsSubscriber(account, wallet => {
    return wallet.watch('syncRatio', syncRatio =>
      setProgressMap(map => {
        const out = new Map(map)
        out.set(wallet.id, syncRatio)
        return out
      })
    )
  })

  // The number of expected wallets acts as the denominator:
  const syncableWalletIds = account.activeWalletIds.filter(walletId => {
    const pluginId = findPluginId(account, walletId)
    const isKeysOnly = pluginId == null || isKeysOnlyPlugin(pluginId)
    const isPaused = userPausedWalletsSet != null && userPausedWalletsSet.has(walletId)
    return !isKeysOnly && !isPaused
  })

  // The number of completed wallets acts as the numerator:
  const syncedWallets = syncableWalletIds.filter(walletId => {
    const syncRatio = progressMap.get(walletId) ?? 0

    return (
      // Count the number of wallets that are fully synced,
      syncRatio > DONE_THRESHOLD ||
      // Including crashed wallets, too
      currencyWalletErrors[walletId] != null
    )
  }).length

  // Calculate the average progress:
  const progress = 100 * (syncableWalletIds.length === 0 ? 1 : syncedWallets / syncableWalletIds.length)

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

function findPluginId(account: EdgeAccount, walletId: string): string | undefined {
  // This is easy if we have a wallet:
  const wallet = account.currencyWallets[walletId]
  if (wallet != null) return wallet.currencyInfo.pluginId

  // Otherwise we have to search:
  const info = account.getWalletInfo(walletId)
  if (info == null) return
  const pluginId = Object.keys(account.currencyConfig).find(pluginId => account.currencyConfig[pluginId].currencyInfo.walletType === info.type)
  return pluginId
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
