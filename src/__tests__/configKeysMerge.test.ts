import { describe, expect, it } from '@jest/globals'
import fs from 'fs'
import path from 'path'

import {
  asMergeableKeys,
  deepMerge,
  nestGlobalKeys,
  redactKey,
  redactValue,
  resolvePluginMaps
} from '../configKeysMerge'
import { asConfigJson, asKeysJson } from '../configKeysSchema'

describe('asMergeableKeys', () => {
  it('accepts a partial overlay without defaulting absent fields', () => {
    const payload = { pluginApiKeys: { changelly: { apiKey: 'k' } } }
    expect(asMergeableKeys(payload)).toEqual(payload)
    expect(asMergeableKeys({})).toEqual({})
  })

  it('rejects a payload that is not an object', () => {
    expect(() => asMergeableKeys(null)).toThrow('not an object')
    expect(() => asMergeableKeys('nope')).toThrow('not an object')
    expect(() => asMergeableKeys([])).toThrow('not an object')
  })

  it('rejects a plugin map that would replace the baked-in map', () => {
    // deepMerge replaces instead of merging when the sides disagree on type, so
    // any of these would drop every baked-in secret in that map.
    expect(() => asMergeableKeys({ pluginApiKeys: null })).toThrow(
      'pluginApiKeys'
    )
    expect(() => asMergeableKeys({ pluginApiKeys: 'oops' })).toThrow(
      'pluginApiKeys'
    )
    expect(() => asMergeableKeys({ rampPlugins: [] })).toThrow('rampPlugins')
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

describe('nestGlobalKeys', () => {
  it('moves flat partner keys under globalKeys', () => {
    const nested = nestGlobalKeys({
      EDGE_API_KEY: 'secret',
      COINGECKO_API_KEY: 'cg',
      AZTECO_API_KEY: 'az'
    })
    expect(nested.EDGE_API_KEY).toBe('secret')
    expect(
      Object.prototype.hasOwnProperty.call(nested, 'COINGECKO_API_KEY')
    ).toBe(false)
    expect(nested.globalKeys.COINGECKO_API_KEY).toBe('cg')
    expect(nested.globalKeys.AZTECO_API_KEY).toBe('az')
  })

  it('prefers an existing nested value over a flat duplicate', () => {
    const nested = nestGlobalKeys({
      IP_API_KEY: 'flat',
      globalKeys: { IP_API_KEY: 'nested' }
    })
    expect(nested.globalKeys.IP_API_KEY).toBe('nested')
  })
})

describe('resolvePluginMaps', () => {
  it('uses the keys object when config enables a plugin with true', () => {
    const config = { corePlugins: { bitcoin: true } }
    const keys = { pluginApiKeys: { bitcoin: { nowNodesApiKey: 'abc' } } }
    const maps = resolvePluginMaps(config as any, keys)
    expect(maps.corePlugins.bitcoin).toEqual({ nowNodesApiKey: 'abc' })
  })

  it('keeps true when config is true and keys has no entry', () => {
    const config = { corePlugins: { bitcoin: true } }
    const maps = resolvePluginMaps(config as any, {})
    expect(maps.corePlugins.bitcoin).toBe(true)
  })

  it('keeps a disabled (false) core plugin disabled despite secrets', () => {
    const config = { corePlugins: { bitcoin: false } }
    const keys = { pluginApiKeys: { bitcoin: { nowNodesApiKey: 'abc' } } }
    const maps = resolvePluginMaps(config as any, keys)
    expect(maps.corePlugins.bitcoin).toBe(false)
  })

  it('uses keys alone when config omits the plugin id', () => {
    const keys = {
      pluginApiKeys: { banxa: { apiKey: 'def' } },
      rampPlugins: { infinite: { orgId: 'org_1' } }
    }
    const maps = resolvePluginMaps({} as any, keys)
    expect(maps.pluginApiKeys.banxa).toEqual({ apiKey: 'def' })
    expect(maps.rampPlugins.infinite).toEqual({ orgId: 'org_1' })
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
    const maps = resolvePluginMaps(config as any, keys)
    expect(Object.keys(maps.pluginApiKeys)).toEqual(['banxa'])
    expect(maps.pluginApiKeys.banxa).toEqual({ apiKey: 'def' })
  })

  it('takes the full swap init object from keys when config is true', () => {
    const config = { swapPlugins: { changelly: true } }
    const keys = {
      pluginApiKeys: { changelly: { partnerId: 'edge', apiKey: 'hunter2' } }
    }
    const maps = resolvePluginMaps(config as any, keys)
    expect(maps.swapPlugins.changelly).toEqual({
      partnerId: 'edge',
      apiKey: 'hunter2'
    })
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

const PLUGIN_MAPS = [
  'corePlugins',
  'swapPlugins',
  'pluginApiKeys',
  'rampPlugins'
] as const

/** Retired providers that must not appear in either file. */
const DROPPED_PROVIDERS = ['bity', 'ionia', 'ionia-staging', 'kado', 'kadoOtc']

/**
 * Invariants on the real split outputs. Skipped when the files are absent
 * (CI without local secrets); developers and Jenkins checkouts that ship
 * config.json / keys.json exercise them.
 */
describe('config.json and keys.json', () => {
  const root = path.join(__dirname, '../..')
  const configPath = path.join(root, 'config.json')
  const keysPath = path.join(root, 'keys.json')
  const present = fs.existsSync(configPath) && fs.existsSync(keysPath)

  const config: Record<string, unknown> = present
    ? JSON.parse(fs.readFileSync(configPath, 'utf8'))
    : {}
  const keys: Record<string, unknown> = present
    ? JSON.parse(fs.readFileSync(keysPath, 'utf8'))
    : {}

  const itIfPresent = present ? it : it.skip

  itIfPresent('parse with asConfigJson / asKeysJson', () => {
    expect(() => asConfigJson.withRest(config)).not.toThrow()
    expect(() => asKeysJson.withRest(keys)).not.toThrow()
  })

  itIfPresent('keeps only boolean flags in config plugin maps', () => {
    for (const mapName of PLUGIN_MAPS) {
      const map = config[mapName]
      expect(map == null || typeof map === 'object').toBe(true)
      for (const [id, value] of Object.entries(
        (map ?? {}) as Record<string, unknown>
      )) {
        expect({ map: mapName, id, value }).toEqual({
          map: mapName,
          id,
          value: expect.any(Boolean)
        })
      }
    }
  })

  itIfPresent('puts no credential material in config.json top-level', () => {
    const secretName =
      /(API_KEY|API_SECRET|SECRET|TOKEN|DSN|ACCOUNT_ID|SENTRY_)/i
    for (const key of Object.keys(config)) {
      if ((PLUGIN_MAPS as readonly string[]).includes(key)) continue
      expect({ key, looksSecret: secretName.test(key) }).toEqual({
        key,
        looksSecret: false
      })
    }
  })

  itIfPresent('omits retired providers from both files', () => {
    for (const id of DROPPED_PROVIDERS) {
      const configMap = (config.pluginApiKeys ?? {}) as Record<string, unknown>
      const keysMap = (keys.pluginApiKeys ?? {}) as Record<string, unknown>
      expect(configMap[id]).toBeUndefined()
      expect(keysMap[id]).toBeUndefined()
    }
  })

  itIfPresent('omits unused ZEC_NODE from both files', () => {
    expect(config.ZEC_NODE).toBeUndefined()
    expect(keys.ZEC_NODE).toBeUndefined()
  })

  itIfPresent('resolves plugin maps without throwing', () => {
    const cleanedConfig = asConfigJson.withRest(config)
    const cleanedKeys = nestGlobalKeys(
      asKeysJson.withRest(keys) as unknown as Record<string, unknown>
    )
    const maps = resolvePluginMaps(cleanedConfig, cleanedKeys)
    expect(maps.corePlugins).toBeDefined()
    expect(maps.swapPlugins).toBeDefined()
    expect(maps.pluginApiKeys).toBeDefined()
    expect(maps.rampPlugins).toBeDefined()
  })
})
