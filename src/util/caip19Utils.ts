import type { EdgeAccount } from 'edge-core-js'

import { SPECIAL_CURRENCY_INFO } from '../constants/WalletAndCurrencyConstants'
import type { EdgeAsset } from '../types/types'
import {
  findTokenIdByNetworkLocation,
  getContractAddress
} from './CurrencyInfoHelpers'

/**
 * Convert an `EdgeAsset` (pluginId + tokenId) to a CAIP-19 asset_type string.
 * - EVM chains (CAIP-2: eip155) with ERC-20 tokens and native slip44 mapping.
 * - Non-EVM chains: BTC, BCH, LTC, SOL native; TRON with TRC20 tokens.
 *
 * Example:
 *   eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48
 *   eip155:1/slip44:60
 *   bitcoin:mainnet/slip44:0
 *   tron:mainnet/trc20:TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj
 *
 * According to CAIP-19, format is: <chain_id>/<asset_namespace>:<asset_reference>
 * See: https://chainagnostic.org/CAIPs/caip-19
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

  // Non-EVM chains:
  const nonEvm: Record<
    string,
    { chainNs: string; reference: string; nativeSlip44?: number }
  > = {
    bitcoin: { chainNs: 'bitcoin', reference: 'mainnet', nativeSlip44: 0 },
    bitcoincash: { chainNs: 'bch', reference: 'mainnet', nativeSlip44: 145 },
    litecoin: { chainNs: 'litecoin', reference: 'mainnet', nativeSlip44: 2 },
    solana: { chainNs: 'solana', reference: 'mainnet', nativeSlip44: 501 },
    tron: { chainNs: 'tron', reference: 'mainnet' }
  }
  const info = nonEvm[pluginId]
  if (info == null) return

  // Tron TRC20 tokens:
  if (pluginId === 'tron' && tokenId != null) {
    let contract: string | undefined
    try {
      contract =
        getContractAddress(account.currencyConfig[pluginId], tokenId) ??
        undefined
    } catch {
      const raw = account.currencyConfig[pluginId]?.allTokens?.[tokenId]
        ?.networkLocation as any
      if (raw?.contractAddress != null) contract = String(raw.contractAddress)
    }
    if (contract == null) return
    return `${info.chainNs}:${info.reference}/trc20:${contract}`
  }

  // Natives for BTC/BCH/LTC/SOL
  if (tokenId == null) {
    if (info.nativeSlip44 != null) {
      return `${info.chainNs}:${info.reference}/slip44:${info.nativeSlip44}`
    }
  }
}

/**
 * Parse a CAIP-19 string and resolve it to an `EdgeAsset` based on the account's
 * currency configurations. Supports:
 * - eip155/: erc20:<contract> or slip44:*.
 * - bitcoin|bch|litecoin|solana: native via slip44 or '<ns>:native' partner variants.
 * - tron:mainnet/trc20:<contract> for TRC20 tokens.
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

  // EVM:
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

  // Non-EVM:
  const nsToPlugin: Record<string, string> = {
    bitcoin: 'bitcoin',
    bch: 'bitcoincash',
    litecoin: 'litecoin',
    solana: 'solana',
    tron: 'tron'
  }
  const pluginId = nsToPlugin[namespace]
  if (pluginId == null) return
  // Ensure mainnet is implied/supported:
  if (reference !== 'mainnet') return
  const [assetNs, assetRef] = assetPart.split(':')

  // Native variants:
  if (assetNs === 'slip44') {
    return { pluginId, tokenId: null }
  }
  if (
    (namespace === 'bitcoin' && assetNs === 'btc' && assetRef === 'native') ||
    (namespace === 'bch' && assetNs === 'bch' && assetRef === 'native') ||
    (namespace === 'litecoin' && assetNs === 'ltc' && assetRef === 'native') ||
    (namespace === 'solana' && assetNs === 'sol' && assetRef === 'native')
  ) {
    return { pluginId, tokenId: null }
  }

  // Tron TRC20 tokens:
  if (namespace === 'tron' && assetNs === 'trc20') {
    const currencyConfig = account.currencyConfig[pluginId]
    if (currencyConfig == null) return
    const allTokens = currencyConfig.allTokens
    for (const [tid, token] of Object.entries(allTokens)) {
      const contract = (token.networkLocation as any)?.contractAddress
      if (typeof contract === 'string' && contract === assetRef) {
        return { pluginId, tokenId: tid }
      }
    }
  }
}
