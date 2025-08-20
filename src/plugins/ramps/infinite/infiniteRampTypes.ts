import { asObject, asString } from 'cleaners'

// Init options cleaner for infinite ramp plugin
export const asInitOptions = asObject({
  apiKey: asString,
  apiUrl: asString,
  orgId: asString
})

// Network mappings - These are ramp plugin specific, not API specific
export const INFINITE_TO_EDGE_NETWORK_MAP: Record<string, string> = {
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

export const EDGE_TO_INFINITE_NETWORK_MAP: Record<string, string> =
  Object.entries(INFINITE_TO_EDGE_NETWORK_MAP).reduce<Record<string, string>>(
    (acc, [infinite, edge]) => {
      acc[edge] = infinite
      return acc
    },
    {}
  )
