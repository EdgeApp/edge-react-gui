import { EdgeAccount, EdgeCurrencyInfo, EdgeCurrencyWallet, EdgeToken, EdgeTokenId } from 'edge-core-js'

import { showError } from '../components/services/AirshipInstance'
import { SPECIAL_CURRENCY_INFO, WALLET_TYPE_ORDER } from '../constants/WalletAndCurrencyConstants'
import { ENV } from '../env'

interface CreateWalletType {
  currencyName: string
  walletType: string
  pluginId: string
  currencyCode: string
}

/**
 * Returns true if this currency supports existing wallets,
 * but doesn't allow new wallets.
 */
export function isKeysOnlyPlugin(pluginId: string): boolean {
  const { keysOnlyMode = false } = SPECIAL_CURRENCY_INFO[pluginId] ?? {}
  return keysOnlyMode || ENV.KEYS_ONLY_PLUGINS[pluginId]
}

function requiresActivation(pluginId: string) {
  const { isAccountActivationRequired = false } = SPECIAL_CURRENCY_INFO[pluginId] ?? {}
  return isAccountActivationRequired
}

/**
 * Grab all the EdgeCurrencyInfo objects in an account.
 */
export function getCurrencyInfos(account: EdgeAccount): EdgeCurrencyInfo[] {
  const { currencyConfig = {} } = account
  return Object.keys(currencyConfig).map(pluginId => currencyConfig[pluginId].currencyInfo)
}

const walletOrderTable: { [walletType: string]: number } = {}
for (let i = 0; i < WALLET_TYPE_ORDER.length; ++i) {
  walletOrderTable[WALLET_TYPE_ORDER[i]] = i
}

/**
 * Sort an array of EdgeCurrencyInfo objects for display to the user.
 */
export function sortCurrencyInfos(infos: EdgeCurrencyInfo[]): EdgeCurrencyInfo[] {
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
export function getCreateWalletTypes(account: EdgeAccount, filterActivation: boolean = false): CreateWalletType[] {
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

/**
 * Get specific wallet for the wallet creation scenes. BTC will always result in segwit
 */
export function getCreateWalletType(account: EdgeAccount, currencyCode: string): CreateWalletType | null {
  const infos = getCurrencyInfos(account)
  const currencyCodeFormatted = currencyCode.toUpperCase()
  const currencyInfo = infos.find(info => info.currencyCode === currencyCodeFormatted)
  return currencyInfo ? makeCreateWalletType(currencyInfo) : null
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
