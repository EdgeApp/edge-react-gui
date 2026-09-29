import { describe, expect, test } from '@jest/globals'

import {
  type DisableAsset,
  isAssetDisabled
} from '../../actions/ExchangeInfoActions'

describe('isAssetDisabled', () => {
  test('an entry without a tokenId matches only the mainnet coin', () => {
    const list: DisableAsset[] = [{ pluginId: 'bitcoinsv', tokenId: undefined }]
    expect(isAssetDisabled(list, 'bitcoinsv', null)).toBe(true)
    expect(isAssetDisabled(list, 'bitcoinsv', 'abcd')).toBe(false)
    expect(isAssetDisabled(list, 'bitcoin', null)).toBe(false)
  })

  test('a specific tokenId matches only that token', () => {
    const list: DisableAsset[] = [{ pluginId: 'ethereum', tokenId: 'abcd' }]
    expect(isAssetDisabled(list, 'ethereum', 'abcd')).toBe(true)
    expect(isAssetDisabled(list, 'ethereum', 'ef01')).toBe(false)
    expect(isAssetDisabled(list, 'ethereum', null)).toBe(false)
  })

  test('allTokens matches every token but not the mainnet coin', () => {
    const list: DisableAsset[] = [
      { pluginId: 'ethereum', tokenId: 'allTokens' }
    ]
    expect(isAssetDisabled(list, 'ethereum', 'abcd')).toBe(true)
    expect(isAssetDisabled(list, 'ethereum', null)).toBe(false)
  })

  test('allCoins matches the mainnet coin and every token', () => {
    const list: DisableAsset[] = [{ pluginId: 'ethereum', tokenId: 'allCoins' }]
    expect(isAssetDisabled(list, 'ethereum', 'abcd')).toBe(true)
    expect(isAssetDisabled(list, 'ethereum', null)).toBe(true)
  })

  test('an empty list disables nothing', () => {
    expect(isAssetDisabled([], 'ethereum', null)).toBe(false)
  })
})
