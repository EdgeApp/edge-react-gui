import type {
  EdgeAccount,
  EdgeCurrencyWallet,
  EdgeSwapQuote,
  EdgeSwapRequest,
  EdgeSwapToAddressInfo,
  EdgeTokenId
} from 'edge-core-js'

import type { DisableAsset } from '../actions/ExchangeInfoActions'
import { lstrings } from '../locales/strings'
import type { EdgeAsset } from '../types/types'

/**
 * A destination asset Houdini can privately route a swap to, paired with the
 * per-chain address-validation regex from Houdini's own `GET /chains`
 * (the Phase 1 coverage matrix, Asana task 1215645061309285).
 */
export interface HoudiniDestinationAsset {
  pluginId: string
  tokenId: EdgeTokenId
  currencyCode: string
  displayName: string
  addressValidation: RegExp
}

/**
 * Prototype subset of Houdini's MVP destination chains (native assets only).
 * A production flow would source this dynamically from Houdini's `GET /chains`
 * (intersected with Edge's `edgeCurrencyPluginIds`) rather than hard-coding it;
 * the full 32-chain matrix lives on Asana task 1215645061309285. The
 * `addressValidation` regexes are Houdini's own, reused here to validate a
 * pasted destination address before spending the user's funds.
 */
export const HOUDINI_DESTINATION_ASSETS: HoudiniDestinationAsset[] = [
  {
    pluginId: 'bitcoin',
    tokenId: null,
    currencyCode: 'BTC',
    displayName: 'Bitcoin',
    addressValidation:
      /^([13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39}|bc1[a-z0-9]{59})$/
  },
  {
    pluginId: 'ethereum',
    tokenId: null,
    currencyCode: 'ETH',
    displayName: 'Ethereum',
    addressValidation: /^(0x)[0-9A-Za-z]{40}$/
  },
  {
    pluginId: 'litecoin',
    tokenId: null,
    currencyCode: 'LTC',
    displayName: 'Litecoin',
    addressValidation: /^(L|M|3)[A-Za-z0-9]{33}$|^(ltc1)[0-9A-Za-z]{39}$/
  },
  {
    pluginId: 'dogecoin',
    tokenId: null,
    currencyCode: 'DOGE',
    displayName: 'Dogecoin',
    addressValidation: /^(D|A|9)[a-km-zA-HJ-NP-Z1-9]{33,34}$/
  },
  {
    pluginId: 'bitcoincash',
    tokenId: null,
    currencyCode: 'BCH',
    displayName: 'Bitcoin Cash',
    addressValidation:
      /^([13][a-km-zA-HJ-NP-Z1-9]{25,34})$|^((bitcoincash:)?(q|p)[a-z0-9]{41})$|^((BITCOINCASH:)?(Q|P)[A-Z0-9]{41})$/
  },
  {
    pluginId: 'dash',
    tokenId: null,
    currencyCode: 'DASH',
    displayName: 'Dash',
    addressValidation: /^[X7][0-9A-Za-z]{33}$/
  },
  {
    pluginId: 'solana',
    tokenId: null,
    currencyCode: 'SOL',
    displayName: 'Solana',
    // Base58, 32-44 chars; every position uses the full Base58 alphabet
    // (excludes 0, O, I, l).
    addressValidation: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
  },
  {
    pluginId: 'tron',
    tokenId: null,
    currencyCode: 'TRX',
    displayName: 'Tron',
    addressValidation: /^T[1-9A-HJ-NP-Za-km-z]{33}$/
  },
  {
    pluginId: 'monero',
    tokenId: null,
    currencyCode: 'XMR',
    displayName: 'Monero',
    addressValidation: /^[48][a-zA-Z\d]{94}([a-zA-Z\d]{11})?$/
  },
  {
    pluginId: 'polygon',
    tokenId: null,
    currencyCode: 'POL',
    displayName: 'Polygon',
    addressValidation: /^(0x)[0-9A-Za-z]{40}$/
  },
  {
    pluginId: 'avalanche',
    tokenId: null,
    currencyCode: 'AVAX',
    displayName: 'Avalanche (C-Chain)',
    addressValidation: /^(0x)[0-9A-Za-z]{40}$/
  },
  {
    pluginId: 'arbitrum',
    tokenId: null,
    currencyCode: 'ETH',
    displayName: 'Arbitrum',
    addressValidation: /^(0x)[0-9A-Za-z]{40}$/
  },
  {
    pluginId: 'base',
    tokenId: null,
    currencyCode: 'ETH',
    displayName: 'Base',
    addressValidation: /^(0x)[0-9A-Za-z]{40}$/
  }
]

/**
 * The Houdini destination chains expressed as `EdgeAsset`s, for filtering the
 * shared `WalletListModal` down to the assets Houdini can privately route to.
 */
export const HOUDINI_DESTINATION_EDGE_ASSETS: EdgeAsset[] =
  HOUDINI_DESTINATION_ASSETS.map(asset => ({
    pluginId: asset.pluginId,
    tokenId: asset.tokenId
  }))

/**
 * Validate a pasted destination address against the asset's Houdini regex.
 */
export function isValidHoudiniDestination(
  asset: HoudiniDestinationAsset,
  address: string
): boolean {
  return asset.addressValidation.test(address.trim())
}

export interface HoudiniPrivateQuoteParams {
  fromWallet: EdgeCurrencyWallet
  fromTokenId: EdgeTokenId
  toPluginId: string
  toTokenId: EdgeTokenId
  toAddress: string
  nativeAmount: string
  /**
   * The `exchangeInfo.swap.disablePlugins` map. If Houdini is disabled
   * server-side the private path must not invoke it, so a disabled Houdini is
   * treated as "no private quote available".
   */
  disablePlugins?: Readonly<Record<string, unknown>>
}

/** Whether a plugin is turned off in the exchange-info disable map. */
export function isPluginDisabled(
  disablePlugins: Readonly<Record<string, unknown>> | undefined,
  pluginId: string
): boolean {
  return disablePlugins?.[pluginId] === true
}

/**
 * Whether the exchange-info `disableAssets` list flags a given asset (by plugin
 * and token), honoring the `allCoins` / `allTokens` wildcards.
 */
export function isAssetDisabled(
  disableAssets: DisableAsset[],
  pluginId: string,
  tokenId: EdgeTokenId
): boolean {
  for (const disableAsset of disableAssets) {
    if (disableAsset.pluginId !== pluginId) continue
    if (disableAsset.tokenId === tokenId) return true
    if (disableAsset.tokenId === 'allCoins') return true
    if (disableAsset.tokenId === 'allTokens' && tokenId != null) return true
  }
  return false
}

/**
 * Build a Houdini swap-to-address request and fetch a Houdini-only private
 * quote. Restricting the request to Houdini keeps a swap-to-address quote from
 * fanning out to every central provider (which would create junk orders and
 * burn their quotas) and guarantees the on-chain deposit is routed through the
 * private path rather than another provider's.
 */
export async function fetchHoudiniPrivateQuote(
  account: EdgeAccount,
  params: HoudiniPrivateQuoteParams
): Promise<EdgeSwapQuote> {
  const {
    fromWallet,
    fromTokenId,
    toPluginId,
    toTokenId,
    toAddress,
    nativeAmount,
    disablePlugins
  } = params

  // Respect a server-side Houdini disable: the private path is Houdini-only, so
  // a disabled Houdini means there is no private quote to offer.
  if (isPluginDisabled(disablePlugins, 'houdini')) {
    throw new Error(lstrings.houdini_ps_no_quote)
  }

  // `toAddressInfo` carries only what the request does not already hold: the
  // address itself and the destination plugin (the token is on the request).
  const toAddressInfo: EdgeSwapToAddressInfo = { toPluginId, toAddress }
  const request: EdgeSwapRequest = {
    fromWallet,
    fromTokenId,
    toTokenId,
    toAddressInfo,
    nativeAmount,
    quoteFor: 'from'
  }

  const disabled: Record<string, true> = {}
  for (const pluginId of Object.keys(account.swapConfig)) {
    if (pluginId !== 'houdini') disabled[pluginId] = true
  }

  const quotes = await account.fetchSwapQuotes(request, {
    preferPluginId: 'houdini',
    disabled
  })
  const quote = quotes.find(candidate => candidate.pluginId === 'houdini')
  if (quote == null) {
    throw new Error(lstrings.houdini_ps_no_quote)
  }
  return quote
}
