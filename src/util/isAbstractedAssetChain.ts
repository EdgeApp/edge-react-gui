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
  if (tokenId != null) {
    // It's a token
    return false
  }
  if (
    currencyInfo.currencyCode === 'ETH' &&
    currencyInfo.pluginId !== 'ethereum'
  ) {
    // It's an ETH L2
    return false
  }
  if (
    currencyInfo.currencyCode === 'BTC' &&
    currencyInfo.pluginId !== 'bitcoin'
  ) {
    // It's a BTC L2
    return false
  }
  if (
    currencyInfo.currencyCode === 'BNB' &&
    currencyInfo.pluginId !== 'binancesmartchain' &&
    currencyInfo.pluginId !== 'binance'
  ) {
    // It's a BNB L2
    return false
  }
  // It's native to the chain
  return true
}
