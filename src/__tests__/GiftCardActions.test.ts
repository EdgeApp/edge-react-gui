import { describe, expect, test } from '@jest/globals'

import { pickGiftCardDestination } from '../actions/GiftCardActions'

describe('pickGiftCardDestination', () => {
  test('opens the market when Phaze is available and unused', () => {
    expect(
      pickGiftCardDestination({
        disablePlugins: {},
        hasPhazeApiKey: true,
        hasPhazeOrders: false
      })
    ).toBe('giftCardMarket')
  })

  test('opens the list when the account already holds Phaze orders', () => {
    expect(
      pickGiftCardDestination({
        disablePlugins: {},
        hasPhazeApiKey: true,
        hasPhazeOrders: true
      })
    ).toBe('giftCardList')
  })

  test('falls back to Bitrefill when Phaze is remotely disabled', () => {
    expect(
      pickGiftCardDestination({
        disablePlugins: { phaze: true },
        hasPhazeApiKey: true,
        hasPhazeOrders: false
      })
    ).toBe('bitrefill')
  })

  test('falls back to Bitrefill when there is no Phaze API key', () => {
    expect(
      pickGiftCardDestination({
        disablePlugins: {},
        hasPhazeApiKey: false,
        hasPhazeOrders: false
      })
    ).toBe('bitrefill')
  })

  test('a disabled Phaze skips the list scene even with past orders', () => {
    expect(
      pickGiftCardDestination({
        disablePlugins: { phaze: true },
        hasPhazeApiKey: true,
        hasPhazeOrders: true
      })
    ).toBe('bitrefill')
  })

  test('a per-brand Phaze disable leaves the provider usable', () => {
    expect(
      pickGiftCardDestination({
        disablePlugins: { phaze: { '12345': true } },
        hasPhazeApiKey: true,
        hasPhazeOrders: false
      })
    ).toBe('giftCardMarket')
  })

  test('falls back to the market when both providers are disabled', () => {
    expect(
      pickGiftCardDestination({
        disablePlugins: { bitrefill: true, phaze: true },
        hasPhazeApiKey: true,
        hasPhazeOrders: false
      })
    ).toBe('giftCardMarket')
  })
})
