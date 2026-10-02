import type { EdgeAccount } from 'edge-core-js'

import type { EdgeAsset, StringMap } from '../../../types/types'
import { findTokenIdByNetworkLocation } from '../../../util/CurrencyInfoHelpers'

/** MoonPay `metadata.networkCode` -> Edge currency pluginId. */
export const MOONPAY_NETWORK_CODE_PLUGINID_MAP: StringMap = {
  algorand: 'algorand',
  arbitrum: 'arbitrum',
  avalanche_c_chain: 'avalanche',
  base: 'base',
  binance_smart_chain: 'binancesmartchain',
  bitcoin: 'bitcoin',
  bitcoin_cash: 'bitcoincash',
  cardano: 'cardano',
  cosmos: 'cosmoshub',
  dogecoin: 'dogecoin',
  ethereum: 'ethereum',
  hedera: 'hedera',
  litecoin: 'litecoin',
  optimism: 'optimism',
  osmosis: 'osmosis',
  polygon: 'polygon',
  ripple: 'ripple',
  solana: 'solana',
  s_sonic: 'sonic',
  stellar: 'stellar',
  sui: 'sui',
  tezos: 'tezos',
  tron: 'tron',
  ton: 'ton',
  zksync: 'zksync'
}

// MoonPay reports some native assets with the burn address as their contract.
const MOONPAY_BURN_ADDRESS = '0x0000000000000000000000000000000000000000'

export interface MoonpayCurrencyMetadata {
  contractAddress: string | null
  networkCode: string
}

/**
 * Resolve the `metadata` of a MoonPay crypto currency to the one Edge asset it
 * names. Returns undefined when Edge has no plugin for the network or no token
 * with that contract, so callers never guess an asset from a ticker.
 */
export const resolveMoonpayAsset = (
  account: EdgeAccount,
  metadata: MoonpayCurrencyMetadata
): EdgeAsset | undefined => {
  const { contractAddress, networkCode } = metadata
  const pluginId = MOONPAY_NETWORK_CODE_PLUGINID_MAP[networkCode]
  if (pluginId == null) return undefined

  // Native asset for this network:
  if (contractAddress == null || contractAddress === MOONPAY_BURN_ADDRESS) {
    return { pluginId, tokenId: null }
  }

  const tokenId = findTokenIdByNetworkLocation({
    account,
    pluginId,
    networkLocation: { contractAddress }
  })
  if (tokenId === undefined) return undefined
  return { pluginId, tokenId }
}
