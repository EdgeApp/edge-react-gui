/**
 * Constants for the Infinite Ramp Plugin
 */

import type { InfiniteCurrenciesResponse } from './infiniteApiTypes'

// Map of Edge pluginId to Infinite network name
export const EDGE_TO_INFINITE_NETWORK_MAP: Record<string, string> = {
  ethereum: 'ethereum',
  polygon: 'polygon',
  avalanche: 'avalanche',
  arbitrum: 'arbitrum',
  optimism: 'optimism',
  base: 'base',
  binancesmartchain: 'binancesmartchain',
  bitcoin: 'bitcoin',
  litecoin: 'litecoin',
  bitcoincash: 'bitcoincash',
  dogecoin: 'dogecoin',
  stellar: 'stellar',
  ripple: 'ripple',
  solana: 'solana'
}

// Normalized currency data structure
export interface NormalizedCryptoData {
  currencyCode: string
  name: string
  type: 'crypto'
  supportsOnRamp: boolean
  supportsOffRamp: boolean
  onRampCountries?: string[]
  offRampCountries?: string[]
  minAmount: string
  maxAmount: string
  precision: number
  network: string
  networkCode: string
  confirmationsRequired: number
}

// Type for normalized currencies map
export type NormalizedCurrenciesMap = Record<
  string,
  Record<string, NormalizedCryptoData>
>

/**
 * Normalizes the currencies data from Infinite API into a structure
 * optimized for quick lookups by pluginId and contract address.
 *
 * For native currencies (no contract address), uses 'native' as the key.
 * Contract addresses are stored in lowercase for consistent lookups.
 */
export function normalizeCurrencies(
  currenciesResponse: InfiniteCurrenciesResponse
): NormalizedCurrenciesMap {
  const normalized: NormalizedCurrenciesMap = {}

  for (const currency of currenciesResponse.currencies) {
    if (currency.type !== 'crypto' || currency.supportedNetworks == null)
      continue

    for (const network of currency.supportedNetworks) {
      // Get the Edge pluginId for this Infinite network
      const edgePluginId = Object.entries(EDGE_TO_INFINITE_NETWORK_MAP).find(
        ([_, infiniteNetwork]) => infiniteNetwork === network.network
      )?.[0]

      if (edgePluginId == null) continue

      // Initialize the pluginId map if it doesn't exist
      normalized[edgePluginId] ??= {}

      // Use 'native' for currencies without contract addresses, otherwise lowercase the address
      const key =
        network.contractAddress != null
          ? network.contractAddress.toLowerCase()
          : 'native'

      // Store the normalized data
      normalized[edgePluginId][key] = {
        currencyCode: currency.code,
        name: currency.name,
        type: 'crypto',
        supportsOnRamp: currency.supportsOnRamp ?? false,
        supportsOffRamp: currency.supportsOffRamp ?? false,
        onRampCountries: currency.onRampCountries,
        offRampCountries: currency.offRampCountries,
        minAmount: currency.minAmount,
        maxAmount: currency.maxAmount,
        precision: currency.precision,
        network: network.network,
        networkCode: network.networkCode,
        confirmationsRequired: network.confirmationsRequired
      }
    }
  }

  return normalized
}
