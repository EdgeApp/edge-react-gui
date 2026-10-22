import { describe, expect, jest, test } from '@jest/globals'
import type { EdgeSwapRequest } from 'edge-core-js'

import {
  asExchangeInfo,
  type DisableAsset,
  getDisabledSwapPlugins,
  isAssetDisabled,
  updateExchangeInfo
} from '../../actions/ExchangeInfoActions'
import type { Dispatch, RootState } from '../../types/reduxTypes'
import { infoServerData } from '../../util/network'

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

describe('asExchangeInfo disableAssetsByPlugin', () => {
  test('defaults to an empty map when missing or malformed', () => {
    expect(asExchangeInfo({ swap: {} }).swap.disableAssetsByPlugin).toEqual({})
    expect(
      asExchangeInfo({ swap: { disableAssetsByPlugin: 'bad' } }).swap
        .disableAssetsByPlugin
    ).toEqual({})
  })

  test('a malformed provider entry keeps the other providers', () => {
    const parsed = asExchangeInfo({
      swap: {
        disableAssetsByPlugin: {
          lifi: { source: [{ pluginId: 'bitcoinsv' }] },
          thorchain: 'bad',
          changenow: {
            source: [],
            destination: [{ pluginId: 'bitcoin' }]
          }
        }
      }
    })
    expect(parsed.swap.disableAssetsByPlugin).toEqual({
      lifi: { source: [], destination: [] },
      thorchain: { source: [], destination: [] },
      changenow: {
        source: [],
        destination: [{ pluginId: 'bitcoin' }]
      }
    })
  })

  test('parses per-provider source and destination lists', () => {
    const parsed = asExchangeInfo({
      swap: {
        disableAssetsByPlugin: {
          lifi: {
            source: [{ pluginId: 'bitcoinsv' }],
            destination: [{ pluginId: 'ethereum', tokenId: 'allTokens' }]
          }
        }
      }
    })
    expect(parsed.swap.disableAssetsByPlugin).toEqual({
      lifi: {
        source: [{ pluginId: 'bitcoinsv' }],
        destination: [{ pluginId: 'ethereum', tokenId: 'allTokens' }]
      }
    })
  })
})

describe('getDisabledSwapPlugins', () => {
  const request = {
    fromWallet: { currencyInfo: { pluginId: 'bitcoin' } },
    fromTokenId: null,
    toWallet: { currencyInfo: { pluginId: 'ethereum' } },
    toTokenId: 'abcd',
    nativeAmount: '1000',
    quoteFor: 'from'
  } as unknown as EdgeSwapRequest

  test('disables only the providers whose lists match the request', () => {
    const disabled = getDisabledSwapPlugins(
      {
        lifi: {
          source: [{ pluginId: 'bitcoin', tokenId: undefined }],
          destination: []
        },
        changenow: {
          source: [],
          destination: [{ pluginId: 'ethereum', tokenId: 'abcd' }]
        },
        thorchain: {
          source: [{ pluginId: 'bitcoin', tokenId: 'allTokens' }],
          destination: [{ pluginId: 'bitcoin', tokenId: undefined }]
        }
      },
      request
    )
    expect(disabled).toEqual({ lifi: true, changenow: true })
  })

  test('source lists do not match the destination asset', () => {
    const disabled = getDisabledSwapPlugins(
      {
        lifi: {
          source: [{ pluginId: 'ethereum', tokenId: 'abcd' }],
          destination: []
        }
      },
      request
    )
    expect(disabled).toEqual({})
  })
})

describe('updateExchangeInfo', () => {
  test('keeps disableAssetsByPlugin from the raw rollup', async () => {
    infoServerData.rollupRaw = {
      exchangeInfo: {
        swap: {
          disableAssetsByPlugin: {
            lifi: { source: [{ pluginId: 'bitcoin' }], destination: [] }
          }
        }
      }
    }
    const dispatch = jest.fn()
    await updateExchangeInfo()(
      dispatch as unknown as Dispatch,
      () => ({} as unknown as RootState)
    )
    const action = dispatch.mock.calls[0][0] as {
      data: ReturnType<typeof asExchangeInfo>
    }
    expect(action.data.swap.disableAssetsByPlugin).toEqual({
      lifi: { source: [{ pluginId: 'bitcoin' }], destination: [] }
    })
  })
})
