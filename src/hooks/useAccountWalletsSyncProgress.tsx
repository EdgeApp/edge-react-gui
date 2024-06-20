import { EdgeAccount } from 'edge-core-js'
import React from 'react'

import { DONE_THRESHOLD } from '../constants/WalletAndCurrencyConstants'
import { useSelector } from '../types/reactRedux'
import { isKeysOnlyPlugin } from '../util/CurrencyInfoHelpers'
import { useWalletsSubscriber } from './useWalletsSubscriber'
import { useWatch } from './useWatch'

/**
 * Returns the overall sync progress for all wallets in an account
 */
export const useAccountWalletsSyncProgress = () => {
  const account = useSelector(state => state.core.account)
  const userPausedWalletsSet = useSelector(state => state.ui.settings.userPausedWalletsSet)
  const currencyWallets = useWatch(account, 'currencyWallets')
  const currencyWalletErrors = useWatch(account, 'currencyWalletErrors')

  const syncableWalletIds = React.useMemo(
    () =>
      account.activeWalletIds.filter(walletId => {
        const pluginId = findPluginId(account, walletId)
        const isKeysOnly = pluginId == null || isKeysOnlyPlugin(pluginId)
        const isPaused = userPausedWalletsSet != null && userPausedWalletsSet.has(walletId)
        return !isKeysOnly && !isPaused
      }),
    [account, userPausedWalletsSet]
  )

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

  const syncedWallets = React.useMemo(
    () =>
      syncableWalletIds.filter(walletId => {
        const syncRatio = progressMap.get(walletId) ?? 0

        return (
          // Count the number of wallets that are fully synced,
          syncRatio > DONE_THRESHOLD ||
          // Including crashed wallets, too
          currencyWalletErrors[walletId] != null
        )
      }).length,
    [currencyWalletErrors, progressMap, syncableWalletIds]
  )

  const progress = React.useMemo(
    () => (syncableWalletIds.length === 0 ? 100 : 100 * (syncedWallets / syncableWalletIds.length)),
    [syncableWalletIds.length, syncedWallets]
  )

  return progress
}

const findPluginId = (account: EdgeAccount, walletId: string): string | undefined => {
  // This is easy if we have a wallet:
  const wallet = account.currencyWallets[walletId]
  if (wallet != null) return wallet.currencyInfo.pluginId

  // Otherwise we have to search:
  const info = account.getWalletInfo(walletId)
  if (info == null) return
  const pluginId = Object.keys(account.currencyConfig).find(pluginId => account.currencyConfig[pluginId].currencyInfo.walletType === info.type)
  return pluginId
}
