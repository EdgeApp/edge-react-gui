import { EdgeAccount, EdgeCurrencyInfo, EdgeCurrencyWallet, EdgeToken, EdgeTokenId } from 'edge-core-js'

import { showError } from '../components/services/AirshipInstance'
import { SPECIAL_CURRENCY_INFO } from '../constants/WalletAndCurrencyConstants'
import { ENV } from '../env'
import { EdgeAsset } from '../types/types'

/**
 * Returns true if this currency supports existing wallets,
 * but doesn't allow new wallets.
 */
export function isKeysOnlyPlugin(pluginId: string): boolean {
  const { keysOnlyMode = false } = SPECIAL_CURRENCY_INFO[pluginId] ?? {}
  return keysOnlyMode || ENV.KEYS_ONLY_PLUGINS[pluginId]
}

/**
 * Grab all the EdgeCurrencyInfo objects in an account.
 */
export function getCurrencyInfos(account: EdgeAccount): EdgeCurrencyInfo[] {
  const { currencyConfig = {} } = account
  return Object.keys(currencyConfig).map(pluginId => currencyConfig[pluginId].currencyInfo)
}

export const getTokenId = (account: EdgeAccount, pluginId: string, currencyCode: string): EdgeTokenId | undefined => {
  const currencyConfig = account.currencyConfig[pluginId]
  if (currencyConfig == null) return
  if (currencyConfig.currencyInfo.currencyCode === currencyCode) return null
  const { allTokens } = currencyConfig
  const tokenId = Object.keys(allTokens).find(edgeToken => allTokens[edgeToken].currencyCode === currencyCode)
  return tokenId
}

export const getTokenIdForced = (account: EdgeAccount, pluginId: string, currencyCode: string): EdgeTokenId => {
  const tokenId = getTokenId(account, pluginId, currencyCode)
  if (tokenId === undefined) throw new Error('getTokenIdForced: tokenId not found')
  return tokenId
}

export const getWalletTokenId = (wallet: EdgeCurrencyWallet, currencyCode: string): EdgeTokenId => {
  const { currencyConfig, currencyInfo } = wallet
  if (currencyInfo.currencyCode === currencyCode) return null
  const { allTokens } = currencyConfig ?? {}
  const tokenId = Object.keys(allTokens).find(edgeToken => allTokens[edgeToken].currencyCode === currencyCode)
  if (tokenId == null) {
    throw new Error(`Cannot find tokenId for currencyCode ${currencyCode}`)
  }
  return tokenId
}

/**
 * Get the currencyCode associated with a tokenId
 */
export const getCurrencyCode = (wallet: EdgeCurrencyWallet, tokenId: EdgeTokenId): string => {
  const { currencyCode } = tokenId != null ? wallet.currencyConfig.allTokens[tokenId] : wallet.currencyInfo
  return currencyCode
}

/**
 * Get the currencyCode associated with a tokenId
 */
export const getCurrencyCodeWithAccount = (account: EdgeAccount, pluginId: string, tokenId: EdgeTokenId): string | undefined => {
  if (account.currencyConfig[pluginId] == null) {
    return
  }
  const { currencyCode } = tokenId != null ? account.currencyConfig[pluginId].allTokens[tokenId] : account.currencyConfig[pluginId].currencyInfo
  return currencyCode
}

export const getToken = (wallet: EdgeCurrencyWallet, tokenId: EdgeTokenId): EdgeToken | undefined => {
  if (tokenId == null) {
    // Either special handling should be done by the caller, or the workflow should not allow this to execute.
  } else {
    const allTokens = wallet.currencyConfig.allTokens
    if (allTokens[tokenId] == null) {
      showError(`Could not find tokenId ${tokenId}`)
      return
    }
    return allTokens[tokenId]
  }
}

export function checkAssetFilter(details: EdgeAsset, allowedAssets?: EdgeAsset[], excludeAssets?: EdgeAsset[]): boolean {
  if (allowedAssets != null && !hasAsset(allowedAssets, details)) {
    return false
  }
  if (excludeAssets != null && hasAsset(excludeAssets, details)) {
    return false
  }
  return true
}

/**
 * Returns true if the asset array includes the given asset.
 */
export function hasAsset(assets: EdgeAsset[], target: EdgeAsset): boolean {
  for (const asset of assets) {
    if (asset.pluginId === target.pluginId && asset.tokenId === target.tokenId) {
      return true
    }
  }
  return false
}
