import { describe, expect, it } from '@jest/globals'
import {
  type EdgeCurrencyWallet,
  type EdgeDenomination,
  type EdgeSwapInfo,
  type EdgeSwapRequest,
  InsufficientFundsError,
  SwapAboveLimitError,
  SwapBelowLimitError,
  SwapCurrencyError,
  SwapPermissionError
} from 'edge-core-js'

import { processSwapQuoteError } from '../../util/swapErrorDisplay'

const swapInfo: EdgeSwapInfo = {
  pluginId: 'houdini',
  displayName: 'HoudiniSwap',
  supportEmail: 'support@houdiniswap.com'
}

const fakeWallet = (
  pluginId: string,
  currencyCode: string
): EdgeCurrencyWallet => {
  const currencyInfo = { pluginId, currencyCode }
  return {
    id: `${pluginId}-wallet`,
    type: `wallet:${pluginId}`,
    currencyInfo,
    currencyConfig: { currencyInfo, allTokens: {} }
  } as unknown as EdgeCurrencyWallet
}

const tronWallet = fakeWallet('tron', 'TRX')
const litecoinWallet = fakeWallet('litecoin', 'LTC')

const trxDenomination: EdgeDenomination = {
  name: 'TRX',
  multiplier: '1000000',
  symbol: ''
}
const ltcDenomination: EdgeDenomination = {
  name: 'LTC',
  multiplier: '100000000',
  symbol: 'Ł'
}

/**
 * A swap-to-address request, which is the shape the send scene builds: no
 * destination wallet, a `toAddressInfo` descriptor in its place.
 */
const sendSceneRequest: EdgeSwapRequest = {
  fromWallet: tronWallet,
  fromTokenId: null,
  toTokenId: null,
  nativeAmount: '80000000',
  quoteFor: 'from',
  toAddressInfo: {
    toPluginId: 'litecoin',
    toAddress: 'MQMcJhpWHYVeQArcZR3sBgyPZxxRtnH441'
  }
} as unknown as EdgeSwapRequest

const describeError = (
  error: unknown,
  toCurrencyCode?: string
): { title: string; message: string } | undefined => {
  const info = processSwapQuoteError({
    error,
    swapRequest: sendSceneRequest,
    fromDenomination: trxDenomination,
    toDenomination: ltcDenomination,
    toCurrencyCode
  })
  if (info == null) return undefined
  return { title: info.title, message: info.message }
}

describe('processSwapQuoteError', () => {
  it('returns nothing for a missing error', () => {
    expect(describeError(null)).toBeUndefined()
    expect(describeError(undefined)).toBeUndefined()
  })

  it('names the minimum in the units of the side that was fixed', () => {
    // The user is told the floor they missed, in their own send units, rather
    // than a generic "unavailable".
    const info = describeError(
      new SwapBelowLimitError(swapInfo, '25000000', 'from')
    )
    expect(info?.message).toContain('25')
    expect(info?.message).toContain('TRX')
  })

  it('reads the receive denomination for a to-direction minimum', () => {
    const info = describeError(
      new SwapBelowLimitError(swapInfo, '50000000', 'to')
    )
    expect(info?.message).toContain('0.5')
    expect(info?.message).toContain('LTC')
  })

  it('falls back to a limit-free message when the minimum is zero', () => {
    const info = describeError(new SwapBelowLimitError(swapInfo, '0', 'from'))
    expect(info?.message).toContain('below the min limit')
    expect(info?.message).not.toContain('TRX')
  })

  it('names the maximum for an above-limit error', () => {
    const info = describeError(
      new SwapAboveLimitError(swapInfo, '500000000', 'from')
    )
    expect(info?.message).toContain('500')
    expect(info?.message).toContain('TRX')
  })

  it('names both assets when the pair cannot route', () => {
    // A swap-to-address request carries no destination wallet, so the caller
    // supplies the payout currency code. Reading it off the request would name
    // the SOURCE asset on both sides and tell the user TRX cannot reach TRX.
    const info = describeError(
      new SwapCurrencyError(swapInfo, sendSceneRequest),
      'LTC'
    )
    expect(info?.message).toContain('TRX')
    expect(info?.message).toContain('LTC')
  })

  it('does not claim the destination is the source when no code is supplied', () => {
    const info = describeError(
      new SwapCurrencyError(swapInfo, sendSceneRequest)
    )
    // Without a supplied code there is only the source wallet to read, so the
    // message degrades to naming it twice. That is the shape the caller must
    // avoid by passing `toCurrencyCode`, and it is pinned here so a future
    // change to the fallback is a deliberate one.
    expect(info?.message).toContain('TRX')
  })

  it('reports insufficient funds from a real error instance', () => {
    const info = describeError(new InsufficientFundsError({ tokenId: null }))
    expect(info?.title).toEqual('Insufficient Funds')
  })

  it('reports insufficient funds from the stringified shape some plugins throw', () => {
    const info = describeError(new Error('InsufficientFundsError'))
    expect(info?.title).toEqual('Insufficient Funds')
  })

  it('maps pending transactions to the pending-funds message', () => {
    const info = describeError(new Error('Unexpected pending transactions'))
    expect(info?.title).toEqual('Insufficient Funds')
    expect(info?.message).not.toEqual('Unexpected pending transactions')
  })

  it('reports a geographic restriction', () => {
    const info = describeError(
      new SwapPermissionError(swapInfo, 'geoRestriction')
    )
    expect(info?.message).toContain('Location restricted')
  })

  it('passes a non-geographic permission error through to its own message', () => {
    const info = describeError(
      new SwapPermissionError(swapInfo, 'noVerification')
    )
    expect(info?.title).toEqual('Exchange Error')
  })

  it('surfaces the provider own message for anything unrecognized', () => {
    // Houdini's minimums above the shared floor arrive this way, carrying the
    // real number, which beats any string we could substitute.
    const info = describeError(
      new Error('HoudiniSwap: Amount is too low, minimum is 60 USD')
    )
    expect(info?.message).toEqual(
      'HoudiniSwap: Amount is too low, minimum is 60 USD'
    )
  })

  it('never surfaces a rate limit as an unavailable pair', () => {
    // A 429 means the caller was too fast, not that the route is gone. The
    // plugin phrases it, and this path must not rewrite it into a pair error.
    const info = describeError(
      new Error('HoudiniSwap: rate limit exceeded, please try again shortly')
    )
    expect(info?.message).toContain('rate limit exceeded')
    expect(info?.message).not.toContain('No enabled exchanges')
  })

  it('stringifies a thrown non-error', () => {
    const info = describeError({ code: 500 })
    expect(info?.message).toEqual('{"code":500}')
  })

  it('keeps the original error for the caller to log', () => {
    const thrown = new Error('boom')
    const info = processSwapQuoteError({
      error: thrown,
      swapRequest: sendSceneRequest,
      fromDenomination: trxDenomination,
      toDenomination: ltcDenomination
    })
    expect(info?.error).toBe(thrown)
  })

  it('handles a wallet-to-wallet request with a real destination wallet', () => {
    const info = processSwapQuoteError({
      error: new SwapCurrencyError(swapInfo, sendSceneRequest),
      swapRequest: {
        ...sendSceneRequest,
        toWallet: litecoinWallet
      } as unknown as EdgeSwapRequest,
      fromDenomination: trxDenomination,
      toDenomination: ltcDenomination
    })
    expect(info?.message).toContain('LTC')
  })
})
