import type { EdgeTokenId } from 'edge-core-js'

import type { CoinrankList } from './network'

/**
 * The coinrank list is keyed by ticker, so it cannot tell apart two assets
 * sharing one. These tokens share a ticker with a different coinrank asset and
 * have no market data of their own, so they must not resolve to a chart.
 */
const tickerCollisionAssets = new Set<string>([
  // Revolut Euro: the EURR ticker resolves to StablR Euro
  'ethereum_8e9c32a536ab623a2e0e9961bce6f5fe7504e084',
  'polygon_11b20f798b70df2201d8f550addcc3378b33dd4a'
])

export const getCoinrankAssetId = (
  coins: CoinrankList,
  pluginId: string,
  tokenId: EdgeTokenId,
  currencyCode: string
): string | undefined => {
  if (tokenId != null && tickerCollisionAssets.has(`${pluginId}_${tokenId}`)) {
    return undefined
  }
  return coins[currencyCode]
}
