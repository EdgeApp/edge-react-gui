import { EdgeAccount, EdgeCurrencyWallet, EdgeParsedUri } from 'edge-core-js'

import { DeepLink } from '../types/DeepLinkTypes'
import { parseDeepLink } from '../util/DeepLinkParser'

export type ParseResult =
  | DeepLink
  | {
      type: 'fioAddressType'
      fioAddress: string
    }
  | {
      type: 'currencyUri'
      parsedUri: EdgeParsedUri
    }
  | {
      type: 'multiCurrencyUris'
      matchingPlugins: { [pluginId: string]: EdgeParsedUri }
    }

export const parseUniversalUri = async (data: string, account?: EdgeAccount, coreWallet?: EdgeCurrencyWallet, tokenId?: string): Promise<ParseResult> => {
  // Parse non currency related deeplinks first including paymentProto links
  const deepLink = parseDeepLink(data)
  if (deepLink.type !== 'other') return deepLink

  // Check for a FIO address
  if (account?.currencyConfig?.fio != null) {
    const fioPlugin = account.currencyConfig.fio
    if (fioPlugin != null) {
      try {
        const isValid = await fioPlugin.otherMethods.isFioAddressValid(data)
        if (isValid) return { type: 'fioAddressType', fioAddress: data }
      } catch (e: any) {
        if (!e.code || e.code !== fioPlugin.currencyInfo.defaultSettings.errorCodes.INVALID_FIO_ADDRESS) {
          throw e
        }
      }
    }
  }

  // Try parsing the URI with the preferred wallet
  if (coreWallet != null) {
    const parsedUri = await coreWallet.parseUri(data).catch(e => undefined)
    if (parsedUri != null) return { type: 'currencyUri', parsedUri }
  }

  // Try parsing the URI with each wallet plugin to determine which it succeeds with
  const matchingPlugins: { [pluginId: string]: EdgeParsedUri } = {}
  const triedPlugins: { [pluginId: string]: boolean } = {}
  if (account?.currencyWallets != null) {
    const wallets = Object.values(account.currencyWallets)
    for (const wallet of wallets) {
      const { pluginId } = wallet.currencyInfo
      if (triedPlugins[pluginId]) continue
      triedPlugins[pluginId] = true
      const parsedUri = await wallet.parseUri(data).catch(e => undefined)
      if (parsedUri) {
        matchingPlugins[pluginId] = parsedUri
      }
    }
    const pluginKeys = Object.keys(matchingPlugins)
    if (pluginKeys.length === 1) {
      return { type: 'currencyUri', parsedUri: matchingPlugins[pluginKeys[0]] }
    } else if (pluginKeys.length > 1) {
      return { type: 'multiCurrencyUris', matchingPlugins }
    }
  }
  throw new Error('UnknownUri')
}
