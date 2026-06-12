import type { EdgeTokenId } from 'edge-core-js'

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
    addressValidation: /^[X|7][0-9A-Za-z]{33}$/
  },
  {
    pluginId: 'solana',
    tokenId: null,
    currencyCode: 'SOL',
    displayName: 'Solana',
    addressValidation:
      /^[1-9A-HJ-NP-SU-Za-hj-np-su-z][1-9A-HJ-NP-Za-km-z]{31,43}$/
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
 * Validate a pasted destination address against the asset's Houdini regex.
 */
export function isValidHoudiniDestination(
  asset: HoudiniDestinationAsset,
  address: string
): boolean {
  return asset.addressValidation.test(address.trim())
}
