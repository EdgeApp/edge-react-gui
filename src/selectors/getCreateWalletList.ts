import { EdgeAccount, EdgeCurrencyInfo, EdgeTokenId } from 'edge-core-js'

import { SPECIAL_CURRENCY_INFO, WALLET_TYPE_ORDER } from '../constants/WalletAndCurrencyConstants'
import { EdgeAsset, WalletListItem } from '../types/types'
import { checkAssetFilter, getCurrencyInfos, getTokenIdForced, hasAsset, isKeysOnlyPlugin } from '../util/CurrencyInfoHelpers'
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

export interface MainWalletCreateItem extends WalletCreateItem {
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

interface CreateWalletType {
  currencyName: string
  walletType: string
  pluginId: string
  currencyCode: string
}

function requiresActivation(pluginId: string) {
  const { isAccountActivationRequired = false } = SPECIAL_CURRENCY_INFO[pluginId] ?? {}
  return isAccountActivationRequired
}

const walletOrderTable: { [walletType: string]: number } = {}
for (let i = 0; i < WALLET_TYPE_ORDER.length; ++i) {
  walletOrderTable[WALLET_TYPE_ORDER[i]] = i
}

/**
 * Sort an array of EdgeCurrencyInfo objects for display to the user.
 */
function sortCurrencyInfos(infos: EdgeCurrencyInfo[]): EdgeCurrencyInfo[] {
  return infos.sort((a, b) => {
    // Use the table first:
    const aIndex = walletOrderTable[a.walletType]
    const bIndex = walletOrderTable[b.walletType]
    if (aIndex != null && bIndex != null) return aIndex - bIndex
    if (aIndex != null) return -1
    if (bIndex != null) return 1

    // Otherwise, sort display names alphabetically:
    return a.displayName.localeCompare(b.displayName)
  })
}

/**
 * The wallet creation scenes use a truncated version of EdgeCurrencyInfo,
 * so make that.
 */
function makeCreateWalletType(currencyInfo: EdgeCurrencyInfo): CreateWalletType {
  const { currencyCode, walletType, displayName: currencyName, pluginId } = currencyInfo
  return {
    currencyName,
    walletType,
    pluginId,
    currencyCode
  }
}

/**
 * Grab a list of wallet types for the wallet creation scenes.
 */
function getCreateWalletTypes(account: EdgeAccount, filterActivation: boolean = false): CreateWalletType[] {
  const infos = sortCurrencyInfos(getCurrencyInfos(account))

  const out: CreateWalletType[] = []
  for (const currencyInfo of infos) {
    const { currencyCode, displayName, pluginId, walletType } = currencyInfo
    // Prevent plugins that are "watch only" from being allowed to create new wallets
    if (isKeysOnlyPlugin(pluginId)) continue
    // Prevent currencies that needs activation from being created from a modal
    if (filterActivation && requiresActivation(pluginId)) continue
    // FIO disable changes
    if (['bitcoin', 'litecoin', 'digibyte'].includes(pluginId)) {
      out.push({
        currencyName: `${displayName} (Segwit)`,
        walletType: `${walletType}-bip49`,
        pluginId,
        currencyCode
      })
      out.push({
        currencyName: `${displayName} (no Segwit)`,
        walletType: `${walletType}-bip44`,
        pluginId,
        currencyCode
      })
    } else {
      out.push(makeCreateWalletType(currencyInfo))
    }
  }

  return out
}
