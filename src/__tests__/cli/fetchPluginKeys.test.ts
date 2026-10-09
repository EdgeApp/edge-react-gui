import { describe, expect, it } from '@jest/globals'
import type { EdgeApiSigner } from 'edge-core-js'

import {
  fetchPluginKeys,
  getKeysAppId,
  pluginApiKeysFromRemote
} from '../../cli/engine/fetchPluginKeys'
import type { fetchRemoteKeys } from '../../util/keysServer'

describe('getKeysAppId', () => {
  it('uses edge when the CLI appId is empty, matching the GUI infoRollup slug', () => {
    expect(getKeysAppId('')).toBe('edge')
  })

  it('keeps an explicit CLI appId', () => {
    expect(getKeysAppId('co.edgesecure.app')).toBe('co.edgesecure.app')
  })
})

/**
 * Which plugin secrets the engine ends up running with.
 *
 * Three layers can name the same pluginId, and the order is written as one
 * spread. Getting it wrong shows up far from here — as a plugin starting
 * with no keys — because the signer decides which `appKeys` layer the info
 * server serves.
 */
describe('pluginApiKeysFromRemote', () => {
  it('lets corePlugins win, then swapPlugins, then the legacy map', () => {
    expect(
      pluginApiKeysFromRemote({
        corePlugins: { monero: 'core' },
        swapPlugins: { monero: 'swap', changelly: 'swap' },
        pluginApiKeys: { monero: 'legacy', changelly: 'legacy', bitcoin: 'old' }
      })
    ).toStrictEqual({
      bitcoin: 'old',
      changelly: 'swap',
      monero: 'core'
    })
  })

  it('keeps a key only the legacy map has', () => {
    expect(
      pluginApiKeysFromRemote({ pluginApiKeys: { bitcoin: 'old' } })
    ).toStrictEqual({ bitcoin: 'old' })
  })

  it('ignores a layer that is not an object', () => {
    // A payload shape this version does not know must not stop the engine
    // booting with the layers it does know.
    expect(
      pluginApiKeysFromRemote({
        swapPlugins: ['changelly'],
        corePlugins: { monero: 'core' }
      })
    ).toStrictEqual({ monero: 'core' })
  })

  it('answers an empty overlay for a payload that is not an object', () => {
    for (const raw of [null, undefined, 'appKeys', 7, []]) {
      expect(pluginApiKeysFromRemote(raw)).toStrictEqual({})
    }
  })
})

describe('fetchPluginKeys', () => {
  /** A `fetchRemoteKeys` that records what it was asked for. */
  const recorder = (): {
    calls: Array<Record<string, unknown>>
    fetchKeys: typeof fetchRemoteKeys
  } => {
    const calls: Array<Record<string, unknown>> = []
    const fetchKeys = (async (opts: Record<string, unknown>) => {
      calls.push(opts)
      return {
        keys: { corePlugins: { monero: 'core' } },
        assuranceLevel: 'hardware',
        rollup: {}
      }
    }) as unknown as typeof fetchRemoteKeys
    return { calls, fetchKeys }
  }

  it('signs with the native signer when there is one', async () => {
    const { calls, fetchKeys } = recorder()
    const apiSigner = { apiKey: 'native' } as unknown as EdgeApiSigner
    const result = await fetchPluginKeys({
      appId: '',
      testMode: true,
      apiSigner,
      // Present, and not used: the signer wins, which is the branch that
      // gets the gated `appKeys` layer.
      apiKey: 'plain',
      apiSecret: new Uint8Array([1, 2, 3]),
      fetchKeys
    })
    expect(calls).toHaveLength(1)
    expect(calls[0].apiSigner).toBe(apiSigner)
    expect(calls[0].secret).toBeUndefined()
    // `edge`, because the CLI boots with an empty appId and the info server
    // expects the slug.
    expect(calls[0].appId).toBe('edge')
    expect(result).toStrictEqual({
      assuranceLevel: 'hardware',
      pluginApiKeys: { monero: 'core' }
    })
  })

  it('falls back to the keys.json secret', async () => {
    const { calls, fetchKeys } = recorder()
    const apiSecret = new Uint8Array([1, 2, 3])
    await fetchPluginKeys({
      appId: 'co.edgesecure.app',
      testMode: false,
      apiKey: 'plain',
      apiSecret,
      fetchKeys
    })
    expect(calls[0].apiKey).toBe('plain')
    expect(calls[0].secret).toBe(apiSecret)
    expect(calls[0].appId).toBe('co.edgesecure.app')
  })

  it('does not reach the server with half a credential', async () => {
    const { calls, fetchKeys } = recorder()
    // A key with no secret cannot sign, so this is the no-credentials case
    // rather than an unsigned request.
    await expect(
      fetchPluginKeys({
        appId: '',
        testMode: true,
        apiKey: 'plain',
        fetchKeys
      })
    ).rejects.toThrow('No HMAC credentials available for infoRollup appKeys')
    expect(calls).toHaveLength(0)
  })

  it('throws when neither a native signer nor apiKey/apiSecret is provided', async () => {
    await expect(
      fetchPluginKeys({ appId: '', testMode: true })
    ).rejects.toThrow('No HMAC credentials available for infoRollup appKeys')
  })
})
