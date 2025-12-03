import type { EdgeAccount, EdgeTokenId, JsonObject } from 'edge-core-js'

import {
  SPECIAL_CURRENCY_INFO,
  WALLET_TYPE_ORDER
} from '../constants/WalletAndCurrencyConstants'
import type { EdgeAsset, WalletListItem } from '../types/types'
import { isKeysOnlyPlugin } from '../util/CurrencyInfoHelpers'
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

  // Used for filtering
  networkLocation?: JsonObject
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
      item.createWalletIds ??= []
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

export const getCreateWalletList = (
  account: EdgeAccount,
  opts: CreateWalletListOpts = {}
): WalletCreateItem[] => {
  const {
    filteredWalletList = [],
    filterActivation,
    allowedAssets = [],
    excludeAssets = [],
    disableLegacy = false
  } = opts
  const segwitSpecialCases = new Set(['bitcoin', 'litecoin', 'digibyte'])
  const existingWalletsMap = new Map<string, Set<EdgeTokenId>>()
  for (const item of filteredWalletList) {
    if (item.type !== 'asset') continue
    const { wallet, tokenId } = item
    const tokenIdSet =
      existingWalletsMap.get(wallet.currencyInfo.pluginId) ?? new Set()
    tokenIdSet.add(tokenId)
    existingWalletsMap.set(wallet.currencyInfo.pluginId, tokenIdSet)
  }
  const assetOverrides = infoServerData.rollup?.assetOverrides ?? {
    disable: {}
  }

  const createAssetMap = (
    assets: EdgeAsset[]
  ): Map<string, Set<EdgeTokenId>> => {
    const assetsMap = new Map<string, Set<EdgeTokenId>>()
    for (const asset of assets) {
      const tokenIdSet = assetsMap.get(asset.pluginId) ?? new Set()
      tokenIdSet.add(asset.tokenId)
      assetsMap.set(asset.pluginId, tokenIdSet)
    }
    return assetsMap
  }
  const excludedAssetsMap = createAssetMap(excludeAssets)
  const allowedAssetsMap = createAssetMap(allowedAssets)

  const isAllowed = (pluginId: string, tokenId: EdgeTokenId) =>
    // if the wallet already exists, then it is not allowed
    !existingWalletsMap.get(pluginId)?.has(tokenId) &&
    // if allowedAssets is empty, then all assets are allowed
    (allowedAssetsMap.size === 0 ||
      allowedAssetsMap.get(pluginId)?.has(tokenId)) &&
    // if excludedAssets is not empty, then the asset must not be in the excluded list
    (excludedAssetsMap.size === 0 ||
      !excludedAssetsMap.get(pluginId)?.has(tokenId))

  // Add top-level wallet types:
  const newWallets: MainWalletCreateItem[] = []
  const newTokens: TokenWalletCreateItem[] = []
  for (const pluginId of Object.keys(account.currencyConfig)) {
    // Prevent plugins that are disabled on the info server
    if (assetOverrides.disable[pluginId]) continue
    // Prevent plugins that are "watch only" from being allowed to create new wallets
    if (isKeysOnlyPlugin(pluginId)) continue
    // Prevent currencies that needs activation from being created from a modal
    if (filterActivation && requiresActivation(pluginId)) continue

    const currencyConfig = account.currencyConfig[pluginId]
    const { currencyCode, displayName, walletType } =
      currencyConfig.currencyInfo

    if (isAllowed(pluginId, null))
      if (!disableLegacy && segwitSpecialCases.has(pluginId)) {
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

    const { builtinTokens, currencyInfo } = currencyConfig
    const tokenIds = Object.keys(builtinTokens)
    if (tokenIds.length === 0) continue

    // Identify which wallets could add the token
    const createWalletIds = Object.keys(account.currencyWallets).filter(
      walletId =>
        account.currencyWallets[walletId].currencyInfo.pluginId === pluginId
    )

    for (const tokenId of tokenIds) {
      const { currencyCode, displayName, networkLocation } =
        builtinTokens[tokenId]

      // Fix for when the token code and chain code are the same (like EOS/TLOS)
      if (currencyCode === currencyInfo.currencyCode) continue

      if (!isAllowed(pluginId, tokenId)) continue

      const item: TokenWalletCreateItem = {
        type: 'create',
        key: `create-${currencyInfo.pluginId}-${tokenId}`,
        currencyCode,
        displayName,
        networkLocation,
        pluginId,
        tokenId,
        createWalletIds
      }
      newTokens.push(item)
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
  walletList.push(...newTokens)

  return walletList
}

/**
 * Filters a wallet create item list using a search string.
 * Supports multi-word search where each word must match at least one field.
 */
export const filterWalletCreateItemListBySearchText = (
  createWalletList: WalletCreateItem[],
  searchText: string
): WalletCreateItem[] => {
  // Split search text into individual terms (space-delimited), then normalize
  const searchTerms = searchText
    .split(/\s+/)
    .map(term => normalizeForSearch(term))
    .filter(term => term.length > 0)

  if (searchTerms.length === 0) return createWalletList

  const out: WalletCreateItem[] = []
  for (const item of createWalletList) {
    const {
      currencyCode,
      displayName,
      networkLocation = {},
      pluginId,
      walletType
    } = item

    // Check if all search terms match at least one field (AND logic)
    const allTermsMatch = searchTerms.every(term => {
      if (
        normalizeForSearch(currencyCode).includes(term) ||
        normalizeForSearch(displayName).includes(term)
      ) {
        return true
      }
      // Search pluginId for mainnet create items
      if (walletType != null && normalizeForSearch(pluginId).includes(term)) {
        return true
      }
      // Search networkLocation values (ie. contractAddress)
      for (const value of Object.values(networkLocation)) {
        if (
          typeof value === 'string' &&
          normalizeForSearch(value).includes(term)
        ) {
          return true
        }
      }
      return false
    })

    if (allTermsMatch) {
      out.push(item)
    }
  }
  return out
}

function requiresActivation(pluginId: string) {
  const { isAccountActivationRequired = false } =
    SPECIAL_CURRENCY_INFO[pluginId] ?? {}
  return isAccountActivationRequired
}

const walletOrderTable: Record<string, number> = {}
for (let i = 0; i < WALLET_TYPE_ORDER.length; ++i) {
  walletOrderTable[WALLET_TYPE_ORDER[i]] = i
}
