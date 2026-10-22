import { describe, expect, it } from '@jest/globals'
import {
  InsufficientFundsError,
  NetworkError,
  SwapBelowLimitError
} from 'edge-core-js'

import { getSwapErrorCategory } from '../../util/swapErrorCategory'

const swapInfo = { pluginId: 'changenow', displayName: '', supportEmail: '' }

describe('getSwapErrorCategory', () => {
  it('detects an approval on a closed quote', () => {
    expect(
      getSwapErrorCategory(
        new TypeError("Cannot call method 'approve' of closed proxy")
      )
    ).toBe('quote_closed')
  })

  it('detects insufficient funds from the core error and from messages', () => {
    expect(
      getSwapErrorCategory(new InsufficientFundsError({ tokenId: null }))
    ).toBe('insufficient_funds')
    expect(
      getSwapErrorCategory(
        new Error('Broadcast failed: insufficient funds for gas')
      )
    ).toBe('insufficient_funds')
  })

  it('detects an expired quote', () => {
    expect(getSwapErrorCategory(new Error('Nexchange quote expired'))).toBe(
      'quote_expired'
    )
    expect(getSwapErrorCategory(new Error('Order not found'), true)).toBe(
      'quote_expired'
    )
  })

  it('detects provider rejections', () => {
    expect(
      getSwapErrorCategory(new SwapBelowLimitError(swapInfo, '1000'))
    ).toBe('provider_rejected')
  })

  it('detects broadcast failures', () => {
    expect(getSwapErrorCategory(new NetworkError())).toBe('broadcast')
    expect(
      getSwapErrorCategory(new Error('Broadcast failed: tx rejected'))
    ).toBe('broadcast')
    expect(getSwapErrorCategory('Error: No valid blockhash found')).toBe(
      'broadcast'
    )
    // The quote can expire while a broadcast times out:
    expect(
      getSwapErrorCategory(
        new Error('Timeout for broadcast to wss://ltc4.trezor.io'),
        true
      )
    ).toBe('broadcast')
  })

  it('falls back to unknown', () => {
    expect(getSwapErrorCategory(new Error('No addresses to process'))).toBe(
      'unknown'
    )
    expect(getSwapErrorCategory(undefined)).toBe('unknown')
  })
})
