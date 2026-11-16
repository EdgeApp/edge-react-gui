import { describe, expect, it } from '@jest/globals'
import type {
  EdgeCurrencyConfig,
  EdgeSwapQuote,
  EdgeTokenId
} from 'edge-core-js'

import { makeSwapConversionValues } from '../../util/swapConversionValues'

/**
 * Only `builtinTokens` is read before a CryptoAmount is asked for a display
 * value, so the rest of the config is left out.
 */
const makeConfig = (builtinTokenIds: string[]): EdgeCurrencyConfig => {
  const builtinTokens = Object.fromEntries(
    builtinTokenIds.map(tokenId => [tokenId, {}])
  )
  // The helper reads one field, so a full config would only add noise:
  return { builtinTokens } as unknown as EdgeCurrencyConfig
}

const makeQuote = (
  fromTokenId: EdgeTokenId,
  toTokenId: EdgeTokenId
): EdgeSwapQuote => {
  const fromConfig = makeConfig(['usdc'])
  const toConfig = makeConfig([])
  // Same as the config: only the wallet's currencyConfig is read.
  const request = {
    fromWallet: { currencyConfig: fromConfig },
    fromTokenId,
    toWallet: { currencyConfig: toConfig },
    toTokenId
  } as unknown as EdgeSwapQuote['request']
  return {
    swapInfo: { pluginId: 'houdini', displayName: '', supportEmail: '' },
    request,
    isEstimate: false,
    fromNativeAmount: '1000',
    toNativeAmount: '2000',
    networkFee: { currencyCode: 'BTC', nativeAmount: '1', tokenId: null },
    pluginId: 'houdini',
    approve: async () => {
      throw new Error('unreachable')
    },
    close: async () => {}
  }
}

describe('makeSwapConversionValues', () => {
  it('carries the quoted amounts, provider and order id', () => {
    const quote = makeQuote('usdc', null)
    const values = makeSwapConversionValues(quote, 'order-1', 'stealthSwap')

    expect(values.conversionType).toBe('swap')
    expect(values.sourceAmount.nativeAmount).toBe('1000')
    expect(values.sourceAmount.tokenId).toBe('usdc')
    expect(values.sourceAmount.currencyConfig).toBe(
      quote.request.fromWallet.currencyConfig
    )
    expect(values.destAmount.nativeAmount).toBe('2000')
    expect(values.destAmount.tokenId).toBe(null)
    expect(values.destAmount.currencyConfig).toBe(
      quote.request.toWallet.currencyConfig
    )
    expect(values.orderId).toBe('order-1')
    expect(values.swapProviderId).toBe('houdini')
    expect(values.isBuiltInAsset).toBe(true)
    expect(values.swapMode).toBe('stealthSwap')
  })

  it('flags a swap that touches a custom token', () => {
    const values = makeSwapConversionValues(
      makeQuote(null, 'custom'),
      undefined,
      'swap'
    )
    expect(values.isBuiltInAsset).toBe(false)
    expect(values.orderId).toBeUndefined()
  })
})
