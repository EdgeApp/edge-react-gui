import { describe, expect, it } from '@jest/globals'
import fs from 'fs'
import path from 'path'

import {
  deepMerge,
  makeEnvFromFiles,
  redactKey,
  redactValue
} from '../envFiles'
import {
  CURRENCY_INIT_MAP,
  isSecretField,
  splitEnv,
  SWAP_INIT_MAP
} from '../envSplit'

describe('isSecretField', () => {
  it('matches apiKey fields without treating pluginApiKeys as a secret', () => {
    expect(isSecretField('apiKey')).toBe(true)
    expect(isSecretField('alchemyApiKey')).toBe(true)
    expect(isSecretField('pluginApiKeys')).toBe(false)
    expect(isSecretField('tonCenterApiKeys')).toBe(true)
  })
})

describe('deepMerge', () => {
  it('merges plain objects recursively with the keys side winning', () => {
    const config = { a: 1, b: { x: 1, y: 1 }, c: 'config' }
    const keys = { b: { y: 2, z: 2 }, c: 'keys' }
    expect(deepMerge(config, keys)).toEqual({
      a: 1,
      b: { x: 1, y: 2, z: 2 },
      c: 'keys'
    })
  })

  it('returns the defined side when the other is undefined', () => {
    expect(deepMerge(undefined, { a: 1 })).toEqual({ a: 1 })
    expect(deepMerge({ a: 1 }, undefined)).toEqual({ a: 1 })
  })

  it('replaces arrays and primitives wholesale', () => {
    expect(deepMerge([1, 2], [3])).toEqual([3])
    expect(deepMerge('a', 'b')).toBe('b')
  })
})

describe('makeEnvFromFiles', () => {
  it('shallow-merges top-level fields with keys winning', () => {
    const config = { APP_CONFIG: 'edge', DEBUG_CORE: false }
    const keys = { EDGE_API_KEY: 'secret', APP_CONFIG: 'override' }
    const env = makeEnvFromFiles(config, keys)
    expect(env.APP_CONFIG).toBe('override')
    expect(env.DEBUG_CORE).toBe(false)
    expect(env.EDGE_API_KEY).toBe('secret')
  })

  it('merges secret objects into a boolean-enabled core plugin', () => {
    const config = { corePlugins: { bitcoin: true } }
    const keys = { pluginApiKeys: { bitcoin: { nowNodesApiKey: 'abc' } } }
    const env = makeEnvFromFiles(config, keys)
    expect((env.corePlugins as any).bitcoin).toEqual({ nowNodesApiKey: 'abc' })
  })

  it('keeps a disabled (false) core plugin disabled despite secrets', () => {
    const config = { corePlugins: { bitcoin: false } }
    const keys = { pluginApiKeys: { bitcoin: { nowNodesApiKey: 'abc' } } }
    const env = makeEnvFromFiles(config, keys)
    expect((env.corePlugins as any).bitcoin).toBe(false)
  })

  it('deep-merges object core plugin config with secret fields', () => {
    const config = { corePlugins: { thorchainrune: { appId: 'edge' } } }
    const keys = {
      pluginApiKeys: { thorchainrune: { ninerealmsClientId: 'xyz' } }
    }
    const env = makeEnvFromFiles(config, keys)
    expect((env.corePlugins as any).thorchainrune).toEqual({
      appId: 'edge',
      ninerealmsClientId: 'xyz'
    })
  })

  it('excludes currency/swap plugin ids from pluginApiKeys', () => {
    const config = {
      corePlugins: { bitcoin: true },
      swapPlugins: { thorchain: true }
    }
    const keys = {
      pluginApiKeys: {
        bitcoin: { nowNodesApiKey: 'abc' },
        thorchain: { ninerealmsClientId: 'xyz' },
        banxa: { apiKey: 'def' }
      }
    }
    const env = makeEnvFromFiles(config, keys)
    expect(Object.keys(env.pluginApiKeys as any)).toEqual(['banxa'])
    expect((env.pluginApiKeys as any).banxa).toEqual({ apiKey: 'def' })
  })
})

describe('redaction', () => {
  it('redactKey truncates strings to at most 8 characters', () => {
    expect(redactKey('supersecretlongkey')).toBe('supersec')
    expect(
      (redactKey('supersecretlongkey') as string).length
    ).toBeLessThanOrEqual(8)
  })

  it('redactKey leaves non-strings untouched', () => {
    expect(redactKey(12345)).toBe(12345)
    expect(redactKey(true)).toBe(true)
  })

  it('redactValue recursively truncates every string', () => {
    const input = {
      apiKey: 'longsecretvalue',
      nested: { token: 'anothersecret', list: ['itemvaluelong'] },
      count: 42,
      enabled: true
    }
    expect(redactValue(input)).toEqual({
      apiKey: 'longsecr',
      nested: { token: 'anothers', list: ['itemvalu'] },
      count: 42,
      enabled: true
    })
  })
})

describe('golden equivalence with legacy env.json', () => {
  const envJsonPath = path.join(__dirname, '../../env.json')
  const hasEnvJson = fs.existsSync(envJsonPath)
  const legacyEnv: Record<string, any> = hasEnvJson
    ? JSON.parse(fs.readFileSync(envJsonPath, 'utf8'))
    : {}

  const { config, keys } = splitEnv(legacyEnv)
  const merged = makeEnvFromFiles(config, keys)

  const testIf = hasEnvJson ? it : it.skip

  testIf('round-trips every currency plugin init', () => {
    for (const [field, id] of Object.entries(CURRENCY_INIT_MAP)) {
      if (legacyEnv[field] === undefined) continue
      expect((merged.corePlugins as any)[id]).toEqual(legacyEnv[field])
    }
  })

  testIf('round-trips every swap plugin init', () => {
    for (const [field, id] of Object.entries(SWAP_INIT_MAP)) {
      if (legacyEnv[field] === undefined) continue
      expect((merged.swapPlugins as any)[id]).toEqual(legacyEnv[field])
    }
  })

  testIf('round-trips PLUGIN_API_KEYS providers', () => {
    const providers = legacyEnv.PLUGIN_API_KEYS ?? {}
    for (const [provider, value] of Object.entries(providers)) {
      expect((merged.pluginApiKeys as any)[provider]).toEqual(value)
    }
  })

  testIf('round-trips RAMP_PLUGIN_INITS', () => {
    const ramps = legacyEnv.RAMP_PLUGIN_INITS ?? {}
    for (const [id, value] of Object.entries(ramps)) {
      expect((merged.rampPlugins as any)[id]).toEqual(value)
    }
  })

  testIf('moves POSTHOG_INIT into pluginApiKeys.posthog', () => {
    if (legacyEnv.POSTHOG_INIT === undefined) return
    expect((merged.pluginApiKeys as any).posthog).toEqual(
      legacyEnv.POSTHOG_INIT
    )
  })

  testIf('moves WALLET_CONNECT_INIT into pluginApiKeys.walletconnect', () => {
    if (legacyEnv.WALLET_CONNECT_INIT === undefined) return
    expect((merged.pluginApiKeys as any).walletconnect).toEqual(
      legacyEnv.WALLET_CONNECT_INIT
    )
  })
})
