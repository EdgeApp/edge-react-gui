// @flow
import { type EdgeAccount, type EdgeCurrencyWallet } from 'edge-core-js'

import { showError } from '../../components/services/AirshipInstance'
import { type BorrowEngine, type BorrowPlugin } from '../borrow-plugins/types'

export const getAaveBorrowEngines = async (plugins: BorrowPlugin[], account: EdgeAccount): Promise<BorrowEngine[]> => {
  const promises: Promise<BorrowEngine | void>[] = []
  for (const plugin of plugins) {
    const currencyPluginId = plugin.borrowInfo.currencyPluginId
    const allWalletsHack: any = Object.values(account.currencyWallets)
    const allWallets: EdgeCurrencyWallet[] = allWalletsHack
    const filteredWallets = allWallets.filter(wallet => wallet.currencyInfo.pluginId === currencyPluginId)

    const ps = filteredWallets.map(wallet => {
      return plugin.makeBorrowEngine(wallet).catch(err => {
        showError(err)
      })
    })

    promises.push(...ps)
  }
  const out: any = (await Promise.all(promises)).filter(result => result != null)
  return out
}

export const getAaveBorrowEngine = async (plugin: BorrowPlugin, wallet: EdgeCurrencyWallet): Promise<BorrowEngine | void> => {
  return plugin.makeBorrowEngine(wallet).catch(_err => {
    // showError(err)
  })
}

// export const filterActiveBorrowEngines = (engines: BorrowEngine[]): BorrowEngine[] => engines.filter(engine => engine.collaterals.length !== 0)
export const filterActiveBorrowEngines = (engines: BorrowEngine[]): BorrowEngine[] => engines.filter(engine => engine.collaterals.length >= 0)
