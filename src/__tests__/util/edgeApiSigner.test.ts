import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { NativeModules } from 'react-native'

import type * as EdgeApiSignerModule from '../../util/edgeApiSigner'

// The key cache is module state, so each case loads a fresh copy:
function loadSigner(nativeModule: unknown): typeof EdgeApiSignerModule {
  NativeModules.EdgeApiSigner = nativeModule
  let loaded: typeof EdgeApiSignerModule | undefined
  jest.isolateModules(() => {
    loaded = jest.requireActual('../../util/edgeApiSigner')
  })
  if (loaded == null) throw new Error('edgeApiSigner did not load')
  return loaded
}

function makeNative(apiKey: string): {
  getApiKey: () => Promise<string>
  signMessage: (message: string) => Promise<unknown>
  signed: string[]
} {
  const signed: string[] = []
  return {
    signed,
    getApiKey: async () => apiKey,
    signMessage: async (message: string) => {
      signed.push(message)
      return { apiKey, signature: 'bmF0aXZlU2ln' }
    }
  }
}

describe('getNativeApiSigner', () => {
  afterEach(() => {
    delete NativeModules.EdgeApiSigner
  })

  it('is undefined when no native module is linked', async () => {
    const { getNativeApiSigner } = loadSigner(undefined)
    expect(await getNativeApiSigner()).toBeUndefined()
  })

  it('is undefined for a partial native module', async () => {
    const { getNativeApiSigner } = loadSigner({ signMessage: async () => ({}) })
    expect(await getNativeApiSigner()).toBeUndefined()
  })

  it('is undefined for a stub build whose key is unusable', async () => {
    for (const stubKey of ['', 'STUB KEY', 'key\n']) {
      const { getNativeApiSigner } = loadSigner(makeNative(stubKey))
      expect(await getNativeApiSigner()).toBeUndefined()
    }
  })

  it('returns a signer that delegates to native for a usable key', async () => {
    const native = makeNative('realKey123')
    const { getNativeApiSigner, getCachedNativeApiKey } = loadSigner(native)
    const signer = await getNativeApiSigner()
    expect(signer).toBeDefined()
    expect(await signer?.signMessage('GET\n/x\n\n1')).toEqual({
      apiKey: 'realKey123',
      signature: 'bmF0aXZlU2ln'
    })
    expect(native.signed).toEqual(['GET\n/x\n\n1'])
    // It warms the cache that push and notification callers read:
    expect(getCachedNativeApiKey()).toBe('realKey123')
  })

  it('makes willSignInfoRollup true through the native signer', async () => {
    const { willSignInfoRollup } = loadSigner(makeNative('realKey123'))
    expect(await willSignInfoRollup()).toBe(true)
  })
})
