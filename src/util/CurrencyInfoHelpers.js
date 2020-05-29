// @flow

import { type EdgeAccount, type EdgeCurrencyInfo } from 'edge-core-js'

import { WALLET_TYPE_ORDER } from '../constants/WalletAndCurrencyConstants.js'
import { type GuiWalletType } from '../types/types.js'

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
export function makeGuiWalletType(currencyInfo: EdgeCurrencyInfo): GuiWalletType {
  return {
    label: currencyInfo.displayName,
    value: currencyInfo.walletType,
    symbolImage: currencyInfo.symbolImage,
    symbolImageDarkMono: currencyInfo.symbolImageDarkMono,
    currencyCode: currencyInfo.currencyCode
  }
}

/**
 * Grab a list of wallet types for the wallet creation scenes.
 */
export function getGuiWalletTypes(account: EdgeAccount): GuiWalletType[] {
  const infos = sortCurrencyInfos(getCurrencyInfos(account))

  const out: GuiWalletType[] = []
  for (const currencyInfo of infos) {
    if (currencyInfo.pluginId === 'fio' && global.isFioDisabled) continue // FIO disable changes
    if (currencyInfo.pluginId === 'bitcoin') {
      out.push({
        label: 'Bitcoin (Segwit)',
        value: 'wallet:bitcoin-bip49',
        symbolImage: currencyInfo.symbolImage,
        symbolImageDarkMono: currencyInfo.symbolImageDarkMono,
        currencyCode: currencyInfo.currencyCode
      })
      out.push({
        label: 'Bitcoin (no Segwit)',
        value: 'wallet:bitcoin-bip44',
        symbolImage: currencyInfo.symbolImage,
        symbolImageDarkMono: currencyInfo.symbolImageDarkMono,
        currencyCode: currencyInfo.currencyCode
      })
    } else {
      out.push(makeGuiWalletType(currencyInfo))
    }
  }

  return out
}

/**
 * Get specific wallet type for the wallet creation scenes. BTC will always result in segwit
 */
export function getGuiWalletType(account: EdgeAccount, currencyCode: string): GuiWalletType | null {
  const infos = getCurrencyInfos(account)
  const currencyCodeFormatted = currencyCode.toUpperCase()
  const currencyInfo = infos.find(info => info.currencyCode === currencyCodeFormatted)
  return currencyInfo ? makeGuiWalletType(currencyInfo) : null
}
