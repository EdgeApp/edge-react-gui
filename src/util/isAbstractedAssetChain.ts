import type { EdgeCurrencyInfo, EdgeTokenId } from 'edge-core-js'

/**
 * An asset native to the chain is the chain's primary asset. Tokens or primary
 * assets to L2s are not considered native to the chain (e.g. Optimism ETH,
 * Bitcoin L2s).
 *
 * @param currencyInfo - The currency info
 * @param tokenId - The token id (optional)
 * @returns True if the currency is an abstracted asset chain, false otherwise
 */
export const isAssetNativeToChain = (
  currencyInfo: EdgeCurrencyInfo,
  tokenId?: EdgeTokenId
): boolean => {
  return (
    tokenId == null &&
    (currencyInfo.currencyCode !== 'ETH' ||
      currencyInfo.pluginId === 'ethereum')
  )
}
