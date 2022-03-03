// @flow

import { type EdgeAccount, type EdgeCurrencyInfo } from 'edge-core-js'

import { EDGE_CONTENT_SERVER, SPECIAL_CURRENCY_INFO, WALLET_TYPE_ORDER } from '../constants/WalletAndCurrencyConstants.js'
import { type CreateWalletType } from '../types/types.js'

/**
 * Get currency icon URL
 */

type CurrencyIcons = {
  symbolImage: string,
  symbolImageDarkMono: string
}

const activationRequiredCurrencyCodes = Object.keys(SPECIAL_CURRENCY_INFO)
  .filter(pluginId => SPECIAL_CURRENCY_INFO[pluginId].isAccountActivationRequired ?? false)
  .map(pluginId => SPECIAL_CURRENCY_INFO[pluginId].chainCode)

export function getCurrencyIcon(pluginId: string, contractAddress?: string = pluginId): CurrencyIcons {
  const url = `${EDGE_CONTENT_SERVER}/currencyIcons/${pluginId.toLowerCase()}/${contractAddress.toLowerCase().replace('0x', '')}`
  return {
    symbolImage: `${url}.png`,
    symbolImageDarkMono: `${url}_dark.png`
  }
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
export function makeCreateWalletType(currencyInfo: EdgeCurrencyInfo): CreateWalletType {
  const { currencyCode, walletType, displayName: currencyName, pluginId } = currencyInfo
  return {
    currencyName,
    walletType,
    currencyCode,
    ...getCurrencyIcon(pluginId)
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
    // Prevent currencies that needs activation from being created from a modal
    if (filterActivation && activationRequiredCurrencyCodes.includes(currencyCode.toUpperCase())) continue
    // FIO disable changes
    if (pluginId === 'fio' && global.isFioDisabled) continue
    if (pluginId === 'bitcoin') {
      out.push({
        currencyName: 'Bitcoin (Segwit)',
        walletType: 'wallet:bitcoin-bip49',
        currencyCode,
        ...getCurrencyIcon(pluginId)
      })
      out.push({
        currencyName: 'Bitcoin (no Segwit)',
        walletType: 'wallet:bitcoin-bip44',
        currencyCode,
        ...getCurrencyIcon(pluginId)
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
