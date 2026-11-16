import type { EdgeSwapQuote } from 'edge-core-js'

import { CryptoAmount } from './CryptoAmount'
import type { SwapConversionValues, SwapMode } from './tracking'

/**
 * The mode of an order placed from the Send scene. A private order that pays
 * out the asset it spends is a Stealth Send, the same split the transaction
 * list makes between Stealth Send and Stealth Swap & Send.
 */
export const getSendSwapMode = (
  request: EdgeSwapQuote['request']
): SwapMode => {
  if (request.privacy !== 'required') return 'swapSend'
  const sameAsset =
    request.fromWallet.currencyInfo.pluginId ===
      request.toWallet.currencyInfo.pluginId &&
    request.fromTokenId === request.toTokenId
  return sameAsset ? 'stealthSend' : 'stealthSwapSend'
}

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
