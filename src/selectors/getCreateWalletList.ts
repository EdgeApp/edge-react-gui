import { EdgeAccount, EdgeTokenId, JsonObject } from 'edge-core-js'

import { SPECIAL_CURRENCY_INFO, WALLET_TYPE_ORDER } from '../constants/WalletAndCurrencyConstants'
import { EdgeAsset, WalletListItem } from '../types/types'
import { checkAssetFilter, hasAsset, isKeysOnlyPlugin } from '../util/CurrencyInfoHelpers'
import { infoServerData } from '../util/network'
import { normalizeForSearch } from '../util/utils'

export interface WalletCreateItem {
  type: 'create'
  key: string
  currencyCode: string
  displayName: string
  pluginId: string

  // Used for creating tokens:
  tokenId: EdgeTokenId
  createWalletIds?: string[]

  // Used for creating wallets:
  keyOptions?: JsonObject
  walletType?: string
}

export interface MainWalletCreateItem extends WalletCreateItem {
  keyOptions: JsonObject
  walletType: string
}

export interface TokenWalletCreateItem extends WalletCreateItem {
  tokenId: string
  createWalletIds: string[]
}

export const splitCreateWalletItems = (
  createItems: WalletCreateItem[]
): {
  newWalletItems: MainWalletCreateItem[]
  newTokenItems: TokenWalletCreateItem[]
} => {
  const newWalletItems: MainWalletCreateItem[] = []
  const newTokenItems: TokenWalletCreateItem[] = []
  createItems.forEach(item => {
    if (item.walletType != null) {
      newWalletItems.push(item as MainWalletCreateItem)
    } else if (item.tokenId != null) {
      if (item.createWalletIds == null) item.createWalletIds = []
      newTokenItems.push(item as TokenWalletCreateItem)
    }
  })
  return { newWalletItems, newTokenItems }
}

interface CreateWalletListOpts {
  filteredWalletList?: WalletListItem[]
  filterActivation?: boolean
  allowedAssets?: EdgeAsset[]
  excludeAssets?: EdgeAsset[]
  /** Don't return "(no Segwit)" create items */
  disableLegacy?: boolean
}

export const getCreateWalletList = (account: EdgeAccount, opts: CreateWalletListOpts = {}): WalletCreateItem[] => {
  const { filteredWalletList = [], filterActivation, allowedAssets, excludeAssets, disableLegacy = false } = opts

  // Add top-level wallet types:
  const newWallets: MainWalletCreateItem[] = []
  for (const pluginId of Object.keys(account.currencyConfig)) {
    const currencyConfig = account.currencyConfig[pluginId]
    const { currencyCode, displayName, walletType } = currencyConfig.currencyInfo

    // Prevent plugins that are "watch only" from being allowed to create new wallets
    if (isKeysOnlyPlugin(pluginId)) continue

    // Prevent currencies that needs activation from being created from a modal
    if (filterActivation && requiresActivation(pluginId)) continue

    if (!disableLegacy && ['bitcoin', 'litecoin', 'digibyte'].includes(pluginId)) {
      newWallets.push({
        type: 'create',
        key: `create-${walletType}-bip49-${pluginId}`,
        currencyCode,
        displayName: `${displayName} (Segwit)`,
        keyOptions: { format: 'bip49' },
        pluginId,
        tokenId: null,
        walletType
      })
      newWallets.push({
        type: 'create',
        key: `create-${walletType}-bip44-${pluginId}`,
        currencyCode,
        displayName: `${displayName} (no Segwit)`,
        keyOptions: { format: 'bip44' },
        pluginId,
        tokenId: null,
        walletType
      })
    } else {
      newWallets.push({
        type: 'create',
        key: `create-${walletType}-${pluginId}`,
        currencyCode,
        displayName,
        keyOptions: {},
        pluginId,
        tokenId: null,
        walletType
      })
    }
  }

  // Sort what we have so far:
  const walletList: WalletCreateItem[] = newWallets.sort((a, b) => {
    // Use the table first:
    const aIndex = walletOrderTable[a.walletType]
    const bIndex = walletOrderTable[b.walletType]
    if (aIndex != null && bIndex != null) return aIndex - bIndex
    if (aIndex != null) return -1
    if (bIndex != null) return 1

    // Otherwise, sort display names alphabetically:
    return a.displayName.localeCompare(b.displayName)
  })

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

      const item: TokenWalletCreateItem = {
        type: 'create',
        key: `create-${currencyInfo.pluginId}-${tokenId}`,
        currencyCode,
        displayName,
        pluginId,
        tokenId,
        createWalletIds
      }
      walletList.push(item)
    }
  }

  // Filter this list:
  const existingWallets: EdgeAsset[] = []
  for (const item of filteredWalletList) {
    if (item.type !== 'asset') continue
    const { wallet, tokenId } = item
    existingWallets.push({
      pluginId: wallet.currencyInfo.pluginId,
      tokenId
    })
  }
  const out = walletList.filter(item => !hasAsset(existingWallets, item) && checkAssetFilter(item, allowedAssets, excludeAssets))
  const assetOverrides = infoServerData.rollup?.assetOverrides ?? { disable: {} }
  return out.filter(item => !assetOverrides.disable[item.pluginId])
}

export const filterWalletCreateItemListBySearchText = (createWalletList: WalletCreateItem[], searchText: string): WalletCreateItem[] => {
  const out: WalletCreateItem[] = []
  const searchTarget = normalizeForSearch(searchText)
  for (const item of createWalletList) {
    const { currencyCode, displayName, pluginId, tokenId, walletType } = item
    if (normalizeForSearch(currencyCode).includes(searchTarget) || normalizeForSearch(displayName).includes(searchTarget)) {
      out.push(item)
      continue
    }
    // Do an additional search for pluginId for mainnet create items
    if (walletType != null && normalizeForSearch(pluginId).includes(searchTarget)) {
      out.push(item)
      continue
    }
    // See if the search term contains the tokenId because we don't have contract addresses in scope. The tokenId is, in most cases, close enough to a contract address to be useful.
    if (tokenId !== null && normalizeForSearch(searchTarget).includes(normalizeForSearch(tokenId))) {
      out.push(item)
    }
  }
  return out
}

function requiresActivation(pluginId: string) {
  const { isAccountActivationRequired = false } = SPECIAL_CURRENCY_INFO[pluginId] ?? {}
  return isAccountActivationRequired
}

const walletOrderTable: { [walletType: string]: number } = {}
for (let i = 0; i < WALLET_TYPE_ORDER.length; ++i) {
  walletOrderTable[WALLET_TYPE_ORDER[i]] = i
}
