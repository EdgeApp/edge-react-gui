import { describe, expect, test } from '@jest/globals'

import type { NestedDisableMap } from '../actions/ExchangeInfoActions'
import {
  asGiftCardInfo,
  isGiftCardBrandDisabled,
  isGiftCardProviderDisabled
} from '../actions/GiftCardInfoActions'

describe('asGiftCardInfo cleaner', () => {
  test('defaults to an empty disable map when disablePlugins is missing', () => {
    expect(asGiftCardInfo({})).toEqual({ disablePlugins: {} })
  })

  test('parses whole-provider and per-brand disable maps', () => {
    const parsed = asGiftCardInfo({
      disablePlugins: {
        bitrefill: true,
        phaze: { '12345': true }
      }
    })
    expect(parsed.disablePlugins).toEqual({
      bitrefill: true,
      phaze: { '12345': true }
    })
  })
})

describe('isGiftCardProviderDisabled', () => {
  test('true only when the provider is disabled as a whole', () => {
    expect(isGiftCardProviderDisabled({ bitrefill: true }, 'bitrefill')).toBe(
      true
    )
    expect(isGiftCardProviderDisabled({}, 'bitrefill')).toBe(false)
    // A per-brand map disables brands, not the whole provider
    expect(isGiftCardProviderDisabled({ phaze: { '1': true } }, 'phaze')).toBe(
      false
    )
  })
})

describe('isGiftCardBrandDisabled', () => {
  test('true when the whole provider is disabled', () => {
    expect(isGiftCardBrandDisabled({ phaze: true }, 'phaze', '12345')).toBe(
      true
    )
  })

  test('true only for the specific disabled brand', () => {
    const disablePlugins: NestedDisableMap = { phaze: { '12345': true } }
    expect(isGiftCardBrandDisabled(disablePlugins, 'phaze', '12345')).toBe(true)
    expect(isGiftCardBrandDisabled(disablePlugins, 'phaze', '99999')).toBe(
      false
    )
  })

  test('false when the provider is absent from the map', () => {
    expect(isGiftCardBrandDisabled({}, 'phaze', '12345')).toBe(false)
  })
})
