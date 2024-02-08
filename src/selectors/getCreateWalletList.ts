import { EdgeAccount, EdgeTokenId } from 'edge-core-js'

import { EdgeAsset, WalletListItem } from '../types/types'
import { checkAssetFilter, getCreateWalletTypes, getTokenIdForced, hasAsset } from '../util/CurrencyInfoHelpers'
import { assetOverrides } from '../util/serverState'
import { normalizeForSearch } from '../util/utils'

export interface WalletCreateItem {
  key: string
  currencyCode: string
  displayName: string
  pluginId: string
  tokenId: EdgeTokenId // Used for creating tokens
  walletType?: string // Used for creating wallets
  createWalletIds?: string[]
}

interface CreateWalletListOpts {
  filteredWalletList?: WalletListItem[]
  filterActivation?: boolean
  allowedAssets?: EdgeAsset[]
  excludeAssets?: EdgeAsset[]
}

export const getCreateWalletList = (account: EdgeAccount, opts: CreateWalletListOpts = {}): WalletCreateItem[] => {
  const { filteredWalletList = [], filterActivation, allowedAssets, excludeAssets } = opts
  const walletList: WalletCreateItem[] = []

  // Add top-level wallet types:
  const createWalletCurrencies = getCreateWalletTypes(account, filterActivation)
  for (const createWalletCurrency of createWalletCurrencies) {
    const { currencyCode, currencyName, pluginId, walletType } = createWalletCurrency
    const tokenId = getTokenIdForced(account, pluginId, currencyCode)
    walletList.push({
      key: `create-${walletType}-${pluginId}`,
      currencyCode,
      displayName: currencyName,
      pluginId,
      tokenId,
      walletType
    })
  }

  // Add token types:
  for (const pluginId of Object.keys(account.currencyConfig)) {
    const currencyConfig = account.currencyConfig[pluginId]
    const { builtinTokens, currencyInfo } = currencyConfig

    // Identify which wallets could add the token
    const createWalletIds = Object.keys(account.currencyWallets).filter(walletId => account.currencyWallets[walletId].currencyInfo.pluginId === pluginId)

    for (const tokenId of Object.keys(builtinTokens)) {
      const { currencyCode, displayName } = builtinTokens[tokenId]

      // Fix for when the token code and chain code are the same (like EOS/TLOS)
      if (currencyCode === currencyInfo.currencyCode) continue

      walletList.push({
        key: `create-${currencyInfo.pluginId}-${tokenId}`,
        currencyCode,
        displayName,
        pluginId,
        tokenId,
        createWalletIds
      })
    }
  }

  // Filter this list:
  const existingWallets: EdgeAsset[] = []
  for (const { wallet, tokenId } of filteredWalletList) {
    if (wallet == null) continue
    existingWallets.push({
      pluginId: wallet.currencyInfo.pluginId,
      tokenId
    })
  }
  const out = walletList.filter(item => !hasAsset(existingWallets, item) && checkAssetFilter(item, allowedAssets, excludeAssets))
  return out.filter(item => !assetOverrides.disable[item.pluginId])
}

export const filterWalletCreateItemListBySearchText = (createWalletList: WalletCreateItem[], searchText: string): WalletCreateItem[] => {
  const out: WalletCreateItem[] = []
  const searchTarget = normalizeForSearch(searchText)
  for (const item of createWalletList) {
    const { currencyCode, displayName, pluginId, walletType } = item
    if (normalizeForSearch(currencyCode).includes(searchTarget) || normalizeForSearch(displayName).includes(searchTarget)) {
      out.push(item)
      continue
    }
    // Do an additional search for pluginId for mainnet create items
    if (walletType != null && normalizeForSearch(pluginId).includes(searchTarget)) {
      out.push(item)
    }
  }
  return out
}
