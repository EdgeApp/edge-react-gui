// @flow

import { type EdgeAccount, type EdgeCurrencyInfo, type EdgeCurrencyWallet } from 'edge-core-js'

import { SPECIAL_CURRENCY_INFO, WALLET_TYPE_ORDER } from '../constants/WalletAndCurrencyConstants.js'
import { type CreateWalletType } from '../types/types.js'

const activationRequiredCurrencyCodes = Object.keys(SPECIAL_CURRENCY_INFO)
  .filter(pluginId => SPECIAL_CURRENCY_INFO[pluginId].isAccountActivationRequired ?? false)
  .map(pluginId => SPECIAL_CURRENCY_INFO[pluginId].chainCode)
const keysOnlyModePlugins = Object.keys(SPECIAL_CURRENCY_INFO).filter(pluginId => SPECIAL_CURRENCY_INFO[pluginId].keysOnlyMode ?? false)

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
export function makeCreateWalletType(currencyInfo: EdgeCurrencyInfo): CreateWalletType {
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
    const { currencyCode, pluginId } = currencyInfo
    // Prevent plugins that are "watch only" from being allowed to create new wallets
    if (keysOnlyModePlugins.includes(pluginId)) continue
    // Prevent currencies that needs activation from being created from a modal
    if (filterActivation && activationRequiredCurrencyCodes.includes(currencyCode.toUpperCase())) continue
    // FIO disable changes
    if (pluginId === 'bitcoin') {
      out.push({
        currencyName: 'Bitcoin (Segwit)',
        walletType: 'wallet:bitcoin-bip49',
        pluginId,
        currencyCode
      })
      out.push({
        currencyName: 'Bitcoin (no Segwit)',
        walletType: 'wallet:bitcoin-bip44',
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
 * Get specific wallet type for the wallet creation scenes. BTC will always result in segwit
 */
export function getCreateWalletType(account: EdgeAccount, currencyCode: string): CreateWalletType | null {
  const infos = getCurrencyInfos(account)
  const currencyCodeFormatted = currencyCode.toUpperCase()
  const currencyInfo = infos.find(info => info.currencyCode === currencyCodeFormatted)
  return currencyInfo ? makeCreateWalletType(currencyInfo) : null
}

export const getTokenId = (account: EdgeAccount, pluginId: string, currencyCode: string): string | void => {
  const { allTokens } = account.currencyConfig[pluginId]
  return Object.keys(allTokens).find(edgeToken => allTokens[edgeToken].currencyCode === currencyCode)
}

/**
 * Get the currencyCode associated with a tokenId
 */
export const getCurrencyCode = (wallet: EdgeCurrencyWallet, tokenId?: string): string => {
  const { currencyCode } = tokenId != null ? wallet.currencyConfig.allTokens[tokenId] : wallet.currencyInfo
  return currencyCode
}

/**
 * If we have a currency code, guess the pluginId and tokenId from that.
 */
export const guessFromCurrencyCode = (account: EdgeAccount, { currencyCode, pluginId, tokenId }: { [key: string]: string | void }) => {
  if (currencyCode == null) return { pluginId, tokenId }
  // If you already have a main network code but not a tokenId, check if you are a token and get the right tokenId
  if (pluginId != null && tokenId == null) {
    tokenId = getTokenId(account, pluginId, currencyCode)
  }
  // If we don't have a pluginId, try to get one for a main network first
  if (pluginId == null) {
    pluginId = Object.keys(account.currencyConfig).find(id => account.currencyConfig[id].currencyInfo.currencyCode === currencyCode)
  }
  // If we still don't have a pluginId, try to get a pluginId and tokenId for a token
  if (pluginId == null) {
    pluginId = Object.keys(account.currencyConfig).find(id => {
      tokenId = getTokenId(account, id, currencyCode)
      return tokenId != null
    })
  }
  return { pluginId, tokenId }
}
