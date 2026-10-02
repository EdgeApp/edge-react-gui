import { describe, expect, it } from '@jest/globals'

import {
  isReturnUrl,
  makePaymentReturnUrl
} from '../../../../plugins/gui/providers/common'

describe('isReturnUrl', () => {
  it('matches the claimed deep.edge.app host per kind', () => {
    expect(
      isReturnUrl('https://deep.edge.app/redirect/payment/', 'payment')
    ).toBe(true)
    expect(
      isReturnUrl('https://deep.edge.app/redirect/success/', 'success')
    ).toBe(true)
    expect(isReturnUrl('https://deep.edge.app/redirect/fail/', 'fail')).toBe(
      true
    )
    expect(
      isReturnUrl('https://deep.edge.app/redirect/cancel/', 'cancel')
    ).toBe(true)
  })

  it('also matches the legacy apex edge.app host so pre-switch orders still intercept', () => {
    expect(isReturnUrl('https://edge.app/redirect/payment/', 'payment')).toBe(
      true
    )
    expect(isReturnUrl('https://edge.app/redirect/success/', 'success')).toBe(
      true
    )
    expect(isReturnUrl('https://edge.app/redirect/fail/', 'fail')).toBe(true)
    expect(isReturnUrl('https://edge.app/redirect/cancel/', 'cancel')).toBe(
      true
    )
  })

  it('matches when the provider appends query params or path suffix (startsWith)', () => {
    expect(
      isReturnUrl(
        'https://deep.edge.app/redirect/payment/?orderId=abc',
        'payment'
      )
    ).toBe(true)
    expect(
      isReturnUrl('https://edge.app/redirect/success/?status=ok', 'success')
    ).toBe(true)
  })

  it('does not cross-match different kinds', () => {
    expect(
      isReturnUrl('https://deep.edge.app/redirect/success/', 'cancel')
    ).toBe(false)
    expect(
      isReturnUrl('https://deep.edge.app/redirect/cancel/', 'success')
    ).toBe(false)
  })

  it('rejects unrelated or look-alike hosts', () => {
    expect(
      isReturnUrl('https://evil.edge.app/redirect/payment/', 'payment')
    ).toBe(false)
    expect(
      isReturnUrl('https://deep.edge.app.evil.com/redirect/payment/', 'payment')
    ).toBe(false)
    expect(
      isReturnUrl('https://example.com/redirect/payment/', 'payment')
    ).toBe(false)
  })
})

describe('makePaymentReturnUrl', () => {
  it('names the provider and a native asset', () => {
    expect(
      makePaymentReturnUrl('moonpay', { pluginId: 'bitcoin', tokenId: null })
    ).toBe('https://deep.edge.app/redirect/payment/moonpay/bitcoin/')
  })

  it('appends the token id to the asset segment', () => {
    expect(
      makePaymentReturnUrl('moonpay', {
        pluginId: 'arbitrum',
        tokenId: 'af88d065e77c8cc2239327c5edb3a432268e5831'
      })
    ).toBe(
      'https://deep.edge.app/redirect/payment/moonpay/arbitrum_af88d065e77c8cc2239327c5edb3a432268e5831/'
    )
  })

  it('percent-encodes a token id that carries reserved characters', () => {
    expect(
      makePaymentReturnUrl('moonpay', {
        pluginId: 'sui',
        tokenId: '0x2::sui::SUI/a b'
      })
    ).toBe(
      'https://deep.edge.app/redirect/payment/moonpay/sui_0x2%3A%3Asui%3A%3ASUI%2Fa%20b/'
    )
  })

  it('is still matched by isReturnUrl once the provider appends its query', () => {
    const redirectUrl = makePaymentReturnUrl('moonpay', {
      pluginId: 'arbitrum',
      tokenId: null
    })
    expect(isReturnUrl(redirectUrl, 'payment')).toBe(true)
    expect(
      isReturnUrl(
        `${redirectUrl}?transactionId=abc&baseCurrencyCode=eth_arbitrum`,
        'payment'
      )
    ).toBe(true)
    expect(isReturnUrl(redirectUrl, 'success')).toBe(false)
  })
})
