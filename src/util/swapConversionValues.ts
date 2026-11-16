import type { EdgeSwapQuote } from 'edge-core-js'

import { CryptoAmount } from './CryptoAmount'
import type { SwapConversionValues, SwapMode } from './tracking'

/**
 * Builds the conversion values a successful swap logs, from the quote the
 * user approved, the order id the provider returned, and the flow that
 * placed the order.
 */
export const makeSwapConversionValues = (
  quote: EdgeSwapQuote,
  orderId: string | undefined,
  swapMode: SwapMode
): SwapConversionValues => {
  const { fromNativeAmount, toNativeAmount, pluginId, request } = quote
  const { fromWallet, fromTokenId, toWallet, toTokenId } = request
  return {
    conversionType: 'swap',
    destAmount: new CryptoAmount({
      nativeAmount: toNativeAmount,
      tokenId: toTokenId,
      currencyConfig: toWallet.currencyConfig
    }),
    sourceAmount: new CryptoAmount({
      nativeAmount: fromNativeAmount,
      tokenId: fromTokenId,
      currencyConfig: fromWallet.currencyConfig
    }),
    isBuiltInAsset:
      (toTokenId == null ||
        toWallet.currencyConfig.builtinTokens[toTokenId] != null) &&
      (fromTokenId == null ||
        fromWallet.currencyConfig.builtinTokens[fromTokenId] != null),
    orderId,
    swapProviderId: pluginId,
    swapMode
  }
}
