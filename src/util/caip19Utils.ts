import type { EdgeAccount } from 'edge-core-js'

import { SPECIAL_CURRENCY_INFO } from '../constants/WalletAndCurrencyConstants'
import type { EdgeAsset } from '../types/types'
import {
  findTokenIdByNetworkLocation,
  getContractAddress
} from './CurrencyInfoHelpers'

// ---------------------------------------------------------------------------
// CAIP Detection Utilities
// ---------------------------------------------------------------------------

/**
 * Detect if a string is a CAIP-19 asset identifier.
 * Format: `<namespace>:<reference>/<asset_namespace>:<asset_reference>`
 * Example: `eip155:1/erc20:0xa0b86991...`
 */
export function isCaip19(str: string): boolean {
  // Must contain both ':' and '/'
  // Format: namespace:reference/asset_namespace:asset_reference
  const slashIndex = str.indexOf('/')
  if (slashIndex === -1) return false
  const chainPart = str.slice(0, slashIndex)
  const assetPart = str.slice(slashIndex + 1)
  return chainPart.includes(':') && assetPart.includes(':')
}

// ---------------------------------------------------------------------------
// CAIP-19 Chain Reference Constants
// See: https://namespaces.chainagnostic.org/
// ---------------------------------------------------------------------------

// BIP-122 genesis hashes (first 32 chars of genesis block hash)
// See: https://namespaces.chainagnostic.org/bip122/caip2
const BIP122_GENESIS = {
  bitcoin: '000000000019d6689c085ae165831e93',
  // BCH uses block 478559 (first block after fork) per CAIP spec
  bitcoincash: '000000000000000000651ef99cb9fcbe',
  litecoin: '12a765e31ffd4059bada1e25190f6e98'
} as const

// Solana mainnet genesis hash (first 32 chars, base58)
// See: https://namespaces.chainagnostic.org/solana/caip2
const SOLANA_MAINNET_GENESIS = '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'

// Tron chain reference used by Phaze API
// NOTE: No official CASA namespace spec exists for Tron. This value appears
// to be a truncated genesis hash. We use it for Phaze compatibility.
const TRON_CHAIN_REF = '0x2b6653dc'

/**
 * Convert an `EdgeAsset` (pluginId + tokenId) to a CAIP-19 asset_type string.
 *
 * Supported formats (per CAIP-19 spec):
 * - EVM chains: eip155:{chainId}/erc20:{contract} or eip155:{chainId}/slip44:{coinType}
 * - BIP-122 chains: bip122:{genesisHash}/slip44:{coinType}
 * - Solana: solana:{genesisHash}/slip44:501
 * - Tron: tron:{chainRef}/trc20:{contract} (non-standard, for Phaze compatibility)
 * - Monero: monero:mainnet/slip44:128
 * - Zcash: zcash:mainnet/slip44:133
 *
 * Examples:
 *   eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
 *   eip155:1/slip44:60
 *   bip122:000000000019d6689c085ae165831e93/slip44:0
 *   bip122:000000000000000000651ef99cb9fcbe/slip44:145
 *   solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501
 *   tron:0x2b6653dc/trc20:TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj
 *   monero:mainnet/slip44:128
 *   zcash:mainnet/slip44:133
 *
 * See: https://standards.chainagnostic.org/CAIPs/caip-19
 */
export function edgeAssetToCaip19(
  account: EdgeAccount,
  asset: EdgeAsset
): string | undefined {
  const { pluginId, tokenId } = asset
  const special = SPECIAL_CURRENCY_INFO[pluginId]
  const wc = special?.walletConnectV2ChainId

  // EVM chains (eip155)
  if (wc?.namespace === 'eip155') {
    const chainRef = wc.reference
    if (tokenId != null) {
      const contract = getContractAddress(
        account.currencyConfig[pluginId],
        tokenId
      )
      if (contract == null) return
      return `eip155:${chainRef}/erc20:${contract}`
    }
    const slip44Map: Record<string, number> = {
      ethereum: 60,
      arbitrum: 60,
      optimism: 60,
      base: 60,
      polygon: 966,
      avalanche: 9000,
      binancesmartchain: 9006
    }
    const slip = slip44Map[pluginId] ?? 60
    return `eip155:${chainRef}/slip44:${slip}`
  }

  // BIP-122 chains (Bitcoin, Bitcoin Cash, Litecoin)
  // Format: bip122:<genesis_block_hash>/slip44:<coin_type>
  const bip122Chains: Record<string, { genesisHash: string; slip44: number }> =
    {
      bitcoin: { genesisHash: BIP122_GENESIS.bitcoin, slip44: 0 },
      bitcoincash: { genesisHash: BIP122_GENESIS.bitcoincash, slip44: 145 },
      litecoin: { genesisHash: BIP122_GENESIS.litecoin, slip44: 2 }
    }

  const bip122Info = bip122Chains[pluginId]
  if (bip122Info != null && tokenId == null) {
    return `bip122:${bip122Info.genesisHash}/slip44:${bip122Info.slip44}`
  }

  // Solana native - uses genesis hash per CAIP spec
  if (pluginId === 'solana' && tokenId == null) {
    return `solana:${SOLANA_MAINNET_GENESIS}/slip44:501`
  }

  // Tron - uses Phaze-specific chain reference (no official CAIP spec)
  if (pluginId === 'tron') {
    if (tokenId != null) {
      let contract: string | undefined
      try {
        contract =
          getContractAddress(account.currencyConfig[pluginId], tokenId) ??
          undefined
      } catch {
        const raw = account.currencyConfig[pluginId]?.allTokens?.[tokenId]
          ?.networkLocation as { contractAddress?: string } | undefined
        if (raw?.contractAddress != null) contract = String(raw.contractAddress)
      }
      if (contract == null) return
      return `tron:${TRON_CHAIN_REF}/trc20:${contract}`
    }
    // Native TRX
    return `tron:${TRON_CHAIN_REF}/slip44:195`
  }

  // Monero native
  if (pluginId === 'monero' && tokenId == null) {
    return 'monero:mainnet/slip44:128'
  }

  // Zcash native
  if (pluginId === 'zcash' && tokenId == null) {
    return 'zcash:mainnet/slip44:133'
  }
}

/**
 * Parse a CAIP-19 string and resolve it to an `EdgeAsset` based on the
 * account's currency configurations.
 *
 * Supported formats:
 * - eip155:{chainId}/erc20:{contract} - EVM tokens
 * - eip155:{chainId}/slip44:{coinType} - EVM native assets
 * - bip122:{genesisHash}/slip44:{coinType} - BTC, BCH, LTC
 * - solana:{genesisHash}/slip44:501 - Solana native
 * - tron:{chainRef}/trc20:{contract} - TRC20 tokens
 * - monero:mainnet/slip44:128 - Monero native
 * - zcash:mainnet/slip44:133 - Zcash native
 *
 * Special cases:
 * - Polygon precompile 0x...1010 treated as native MATIC (Phaze API workaround)
 *
 * Returns undefined if not resolvable/supported.
 */
export function caip19ToEdgeAsset(
  account: EdgeAccount,
  caip19: string
): EdgeAsset | undefined {
  // Basic parse: "<namespace>:<ref>/<assetns>:<assetref>"
  const [chainPart, assetPart] = caip19.split('/')
  if (chainPart == null || assetPart == null) return
  const [namespace, reference] = chainPart.split(':')

  // EVM chains (eip155)
  if (namespace === 'eip155' && reference != null) {
    let pluginId: string | undefined
    for (const [pid, info] of Object.entries(SPECIAL_CURRENCY_INFO)) {
      if (
        info.walletConnectV2ChainId?.namespace === 'eip155' &&
        info.walletConnectV2ChainId?.reference === reference
      ) {
        pluginId = pid
        break
      }
    }
    if (pluginId == null) return

    const [assetNs, assetRef] = assetPart.split(':')
    if (assetNs === 'erc20') {
      // Polygon native token precompile - treat as native MATIC
      // TODO: Remove once Phaze fixes their CAIP-19 for MATIC (should be slip44:966)
      if (
        pluginId === 'polygon' &&
        assetRef.toLowerCase() === '0x0000000000000000000000000000000000001010'
      ) {
        return { pluginId, tokenId: null }
      }

      const tokenId = findTokenIdByNetworkLocation({
        account,
        pluginId,
        networkLocation: { contractAddress: assetRef.toLowerCase() }
      })
      if (tokenId == null) return
      return { pluginId, tokenId }
    }
    if (assetNs === 'slip44') {
      return { pluginId, tokenId: null }
    }
    return
  }

  // BIP-122 chains (Bitcoin, Bitcoin Cash, Litecoin)
  // Format: bip122:<genesis_hash>/slip44:<coin_type>
  if (namespace === 'bip122' && reference != null) {
    const genesisToPlugin: Record<string, string> = {
      [BIP122_GENESIS.bitcoin]: 'bitcoin',
      [BIP122_GENESIS.bitcoincash]: 'bitcoincash',
      [BIP122_GENESIS.litecoin]: 'litecoin'
    }
    const [assetNs, assetRef] = assetPart.split(':')

    // Determine pluginId from genesis hash
    let pluginId = genesisToPlugin[reference]

    // Fallback: BTC genesis hash with slip44:145 means BCH
    // (some implementations may use BTC's genesis for BCH)
    if (pluginId == null && reference === BIP122_GENESIS.bitcoin) {
      if (assetNs === 'slip44' && assetRef === '145') {
        pluginId = 'bitcoincash'
      }
    }

    if (pluginId == null) return

    if (assetNs === 'slip44') {
      return { pluginId, tokenId: null }
    }
    return
  }

  // Solana - accepts genesis hash format per CAIP spec
  if (namespace === 'solana' && reference != null) {
    // Accept mainnet genesis hash (standard) or 'mainnet' (legacy/non-standard)
    if (reference !== SOLANA_MAINNET_GENESIS && reference !== 'mainnet') {
      return
    }
    const [assetNs, assetRef] = assetPart.split(':')
    if (assetNs === 'slip44') {
      return { pluginId: 'solana', tokenId: null }
    }
    // Legacy format: solana:mainnet/sol:native
    if (assetNs === 'sol' && assetRef === 'native') {
      return { pluginId: 'solana', tokenId: null }
    }
    return
  }

  // Tron - accepts Phaze chain reference or legacy 'mainnet'
  // NOTE: No official CAIP namespace for Tron exists
  if (namespace === 'tron' && reference != null) {
    // Accept Phaze's chain reference or legacy 'mainnet'
    if (reference !== TRON_CHAIN_REF && reference !== 'mainnet') {
      return
    }
    const [assetNs, assetRef] = assetPart.split(':')

    if (assetNs === 'slip44') {
      return { pluginId: 'tron', tokenId: null }
    }

    // TRC20 tokens
    if (assetNs === 'trc20') {
      const currencyConfig = account.currencyConfig.tron
      if (currencyConfig == null) return
      const allTokens = currencyConfig.allTokens
      for (const [tid, token] of Object.entries(allTokens)) {
        const contract = (token.networkLocation as { contractAddress?: string })
          ?.contractAddress
        if (typeof contract === 'string' && contract === assetRef) {
          return { pluginId: 'tron', tokenId: tid }
        }
      }
    }
  }

  // Monero - native only
  if (namespace === 'monero' && reference === 'mainnet') {
    const [assetNs] = assetPart.split(':')
    if (assetNs === 'slip44') {
      return { pluginId: 'monero', tokenId: null }
    }
    return
  }

  // Zcash - native only
  if (namespace === 'zcash' && reference === 'mainnet') {
    const [assetNs] = assetPart.split(':')
    if (assetNs === 'slip44') {
      return { pluginId: 'zcash', tokenId: null }
    }
  }
}
