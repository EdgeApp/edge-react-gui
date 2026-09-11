import { describe, expect, it } from '@jest/globals'
import type { EdgeAccount, EdgeTransaction } from 'edge-core-js'

import {
  hasParentFeeRow,
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

describe('hasParentFeeRow', () => {
  const makeTx = (
    tokenId: string | null,
    networkFees: Array<{ tokenId: string | null; nativeAmount: string }>
  ): EdgeTransaction => ({ tokenId, networkFees } as unknown as EdgeTransaction)

  it('reports a token send that paid its fee in the parent coin', () => {
    const tx = makeTx('abcd', [
      { tokenId: 'abcd', nativeAmount: '0' },
      { tokenId: null, nativeAmount: '210000000000000' }
    ])
    expect(hasParentFeeRow(tx)).toBe(true)
  })

  it('reports no fee row for a mainnet send', () => {
    // A mainnet send's own fee is a `tokenId: null` entry too, so the token
    // check has to come first. Stamping a `tokenId: null` action here would
    // invent a parent-currency entry the swap plugin never filed.
    const tx = makeTx(null, [{ tokenId: null, nativeAmount: '702' }])
    expect(hasParentFeeRow(tx)).toBe(false)
  })

  it('reports no fee row for a token send billed in the token itself', () => {
    const tx = makeTx('abcd', [{ tokenId: 'abcd', nativeAmount: '1000' }])
    expect(hasParentFeeRow(tx)).toBe(false)
  })
})
