import { describe, expect, test } from '@jest/globals'

import {
  pickGiftCardDestination,
  pickPurchaseDestination
} from '../actions/GiftCardActions'

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

  test('a disabled Phaze keeps the list scene for accounts with orders', () => {
    expect(
      pickGiftCardDestination({
        disablePlugins: { phaze: true },
        hasPhazeApiKey: true,
        hasPhazeOrders: true
      })
    ).toBe('giftCardList')
  })

  test('keeps the list scene with orders when both providers are disabled', () => {
    expect(
      pickGiftCardDestination({
        disablePlugins: { bitrefill: true, phaze: true },
        hasPhazeApiKey: true,
        hasPhazeOrders: true
      })
    ).toBe('giftCardList')
  })

  test('orders without an API key still fall back to Bitrefill', () => {
    expect(
      pickGiftCardDestination({
        disablePlugins: {},
        hasPhazeApiKey: false,
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

  test('reports unavailable when both providers are disabled', () => {
    expect(
      pickGiftCardDestination({
        disablePlugins: { bitrefill: true, phaze: true },
        hasPhazeApiKey: true,
        hasPhazeOrders: false
      })
    ).toBe('unavailable')
  })
})

describe('pickPurchaseDestination', () => {
  test('opens Bitrefill when it is enabled', () => {
    expect(pickPurchaseDestination({ phaze: true })).toBe('bitrefill')
  })

  test('reports unavailable when Bitrefill is disabled too', () => {
    expect(pickPurchaseDestination({ bitrefill: true, phaze: true })).toBe(
      'unavailable'
    )
  })
})
