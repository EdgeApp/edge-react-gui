import { describe, expect, it } from '@jest/globals'
import type { EdgeAccount } from 'edge-core-js'

import {
  disableAssetsCover,
  getStealthDisableAssets,
  makeStealthSwapRequestOptions
} from '../../util/stealthSwap'

// Only `swapConfig`'s key set is read, to find the plugins to switch off:
const fakeAccount = (swapPluginIds: string[]): EdgeAccount => {
  const swapConfig: Record<string, object> = {}
  for (const pluginId of swapPluginIds) swapConfig[pluginId] = {}
  return { swapConfig } as unknown as EdgeAccount
}

const account = fakeAccount(['houdini', 'changenow', 'letsexchange', 'unizen'])

describe('makeStealthSwapRequestOptions', () => {
  it('disables every provider except Houdini', () => {
    const { disabled } = makeStealthSwapRequestOptions(account)
    expect(disabled).toEqual({
      changenow: true,
      letsexchange: true,
      unizen: true
    })
    expect(disabled?.houdini).toBeUndefined()
  })

  it('clears a preferred provider that would fight the restriction', () => {
    // A leftover `preferPluginId` cannot override `disabled`, but leaving it
    // set makes the request self-contradictory and its intent unreadable.
    const options = makeStealthSwapRequestOptions(account, {
      preferPluginId: 'changenow',
      preferType: 'CEX'
    })
    expect(options.preferPluginId).toBeUndefined()
    expect(options.preferType).toBeUndefined()
  })

  it('leaves the exchange setting alone by default', () => {
    // The Exchange scene keeps honoring the user's provider settings, so a
    // stealth swap started there must not force-enable anything.
    const options = makeStealthSwapRequestOptions(account)
    expect(options.forceEnabled).toBeUndefined()
  })

  it('force-enables Houdini when the caller ignores the provider setting', () => {
    // The send scene's path: the swap setting governs which providers the
    // aggregator may pick among, so it must not switch off a send feature that
    // happens to be powered by one of them.
    const options = makeStealthSwapRequestOptions(account, undefined, {
      ignoreProviderSetting: true
    })
    expect(options.forceEnabled).toEqual({ houdini: true })
  })

  it('keeps a caller force-enabling other plugins', () => {
    const options = makeStealthSwapRequestOptions(
      account,
      { forceEnabled: { changenow: true } },
      { ignoreProviderSetting: true }
    )
    expect(options.forceEnabled).toEqual({ changenow: true, houdini: true })
  })

  it('preserves unrelated options', () => {
    const options = makeStealthSwapRequestOptions(account, {
      promoCodes: { houdini: 'edge' },
      slowResponseMs: 1234
    })
    expect(options.promoCodes).toEqual({ houdini: 'edge' })
    expect(options.slowResponseMs).toEqual(1234)
  })

  it('keeps a caller own disabled entries alongside its own', () => {
    // `disabled` wins over `forceEnabled` in the core, so a caller that
    // disabled Houdini itself still gets no Houdini quote.
    const options = makeStealthSwapRequestOptions(
      account,
      { disabled: { houdini: true } },
      { ignoreProviderSetting: true }
    )
    expect(options.disabled?.houdini).toEqual(true)
  })

  it('handles an account with Houdini as its only provider', () => {
    const { disabled } = makeStealthSwapRequestOptions(fakeAccount(['houdini']))
    expect(disabled).toEqual({})
  })
})

describe('disableAssetsCover', () => {
  const usdt = 'a614f803b6fd780986a42c78ec9c7f77e6ded13c'

  it('matches an entry without a token to the chain coin only', () => {
    const disableAssets = [{ pluginId: 'tron', tokenId: undefined }]
    expect(disableAssetsCover(disableAssets, 'tron', null)).toBe(true)
    expect(disableAssetsCover(disableAssets, 'tron', usdt)).toBe(false)
  })

  it('matches one named token', () => {
    const disableAssets = [{ pluginId: 'tron', tokenId: usdt }]
    expect(disableAssetsCover(disableAssets, 'tron', usdt)).toBe(true)
    expect(disableAssetsCover(disableAssets, 'tron', null)).toBe(false)
  })

  it('matches every token but the coin for allTokens', () => {
    const disableAssets = [{ pluginId: 'tron', tokenId: 'allTokens' }]
    expect(disableAssetsCover(disableAssets, 'tron', usdt)).toBe(true)
    expect(disableAssetsCover(disableAssets, 'tron', null)).toBe(false)
  })

  it('matches the coin and every token for allCoins', () => {
    const disableAssets = [{ pluginId: 'tron', tokenId: 'allCoins' }]
    expect(disableAssetsCover(disableAssets, 'tron', usdt)).toBe(true)
    expect(disableAssetsCover(disableAssets, 'tron', null)).toBe(true)
  })

  it('ignores entries for other chains', () => {
    const disableAssets = [{ pluginId: 'ethereum', tokenId: 'allCoins' }]
    expect(disableAssetsCover(disableAssets, 'tron', null)).toBe(false)
  })
})

describe('getStealthDisableAssets', () => {
  const disableAssets = {
    source: [{ pluginId: 'zano', tokenId: undefined }],
    destination: [{ pluginId: 'tron', tokenId: 'allTokens' }]
  }

  it('adds the bans on Houdini to each side', () => {
    const merged = getStealthDisableAssets(disableAssets, {
      houdini: {
        source: [{ pluginId: 'bitcoinsv', tokenId: undefined }],
        destination: [{ pluginId: 'monero', tokenId: undefined }]
      }
    })
    expect(merged).toEqual({
      source: [
        { pluginId: 'zano', tokenId: undefined },
        { pluginId: 'bitcoinsv', tokenId: undefined }
      ],
      destination: [
        { pluginId: 'tron', tokenId: 'allTokens' },
        { pluginId: 'monero', tokenId: undefined }
      ]
    })
    // A source ban must not refuse the same asset as a destination:
    expect(disableAssetsCover(merged.source, 'bitcoinsv', null)).toBe(true)
    expect(disableAssetsCover(merged.destination, 'bitcoinsv', null)).toBe(
      false
    )
  })

  it('ignores the bans on other providers', () => {
    const merged = getStealthDisableAssets(disableAssets, {
      changenow: {
        source: [{ pluginId: 'bitcoinsv', tokenId: undefined }],
        destination: [{ pluginId: 'monero', tokenId: undefined }]
      }
    })
    expect(merged).toEqual(disableAssets)
  })

  it('returns the same lists when nothing is banned for Houdini', () => {
    // The send scene memoizes on this result, so an unchanged kill switch
    // must not hand its quote effect a new object:
    expect(getStealthDisableAssets(disableAssets, {})).toBe(disableAssets)
  })
})
