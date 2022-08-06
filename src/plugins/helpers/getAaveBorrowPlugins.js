// @flow
import { type EdgeAccount, type EdgeCurrencyWallet } from 'edge-core-js'

import { showError } from '../../components/services/AirshipInstance'
import { type BorrowEngine, type BorrowPlugin } from '../borrow-plugins/types'

// TODO: Consider this GUI requirement of reading from both plugin and engine
// data types when finalizing API in the core
export type TempBorrowInfo = { borrowEngine: BorrowEngine, borrowPlugin: BorrowPlugin }

// -----------------------------------------------------------------------------
// Get an array of tuples containing supported borrow engines and their
// respective borrow plugins based on the available wallets.
// -----------------------------------------------------------------------------
export const getAaveBorrowInfos = async (plugins: BorrowPlugin[], account: EdgeAccount): Promise<TempBorrowInfo[]> => {
  const promises: Promise<{ borrowEngine: BorrowEngine | void, borrowPlugin: BorrowPlugin }>[] = []

  for (const plugin of plugins) {
    const currencyPluginId = plugin.borrowInfo.currencyPluginId
    const allWalletsHack: any = Object.values(account.currencyWallets)
    const allWallets: EdgeCurrencyWallet[] = allWalletsHack
    const filteredWallets = allWallets.filter(wallet => wallet.currencyInfo.pluginId === currencyPluginId)

    const ps = filteredWallets.map(async wallet => {
      const engine = await plugin.makeBorrowEngine(wallet).catch(err => {
        showError(err)
      })

      return { borrowEngine: engine, borrowPlugin: plugin }
    })

    promises.push(...ps)
  }
  const out: any = (await Promise.all(promises)).filter(({ borrowEngine, borrowPlugin }) => borrowEngine != null)
  return out
}

// -----------------------------------------------------------------------------
// Get a BorrowEngine from a BorrowPlugin and wallet
// -----------------------------------------------------------------------------
export const getAaveBorrowInfo = async (plugin: BorrowPlugin, wallet: EdgeCurrencyWallet): Promise<TempBorrowInfo> => {
  const engine = await plugin.makeBorrowEngine(wallet).catch(err => {
    showError(err)
  })
  const out: any = { borrowEngine: engine, borrowPlugin: plugin }
  return out
}

// -----------------------------------------------------------------------------
// Filter borrow infos (plugin, engine) for only the ones with open debts.
// -----------------------------------------------------------------------------
export const filterActiveBorrowInfos = (borrowInfos: TempBorrowInfo[]): TempBorrowInfo[] =>
  borrowInfos.filter(borrowInfo => borrowInfo.borrowEngine.debts.length !== 0)
