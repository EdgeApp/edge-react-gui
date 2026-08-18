// Helpers for merging config.json enablement with keys.json secrets into
// resolved plugin maps, and for deep-merging remote key overlays.

import { asMap, asUnknown } from 'cleaners'

import {
  type ConfigJson,
  GLOBAL_KEY_NAMES,
  type GlobalKeys,
  type RuntimeKeys
} from './configKeysSchema'

/** Open string-keyed object; fails closed on non-objects (unlike a soft coerce). */
const asUnknownMap = asMap(asUnknown)

export function isPlainObject(
  value: unknown
): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Maps inside a keys payload that must stay objects to merge safely. */
const KEYS_PAYLOAD_MAP_FIELDS = ['pluginApiKeys', 'rampPlugins', 'globalKeys']

/**
 * Structural check on a keys payload about to be merged into KEYS, whichever
 * tier it came from: a `GET /v1/getKeys` response or the on-disk cache.
 *
 * Deliberately not `asKeysJson`. That cleaner defaults every absent field, and
 * these payloads are partial overlays, so defaulting would let a sparse one
 * blank out baked-in values during the merge.
 */
export function asMergeableKeys(raw: unknown): Record<string, unknown> {
  if (!isPlainObject(raw)) {
    throw new TypeError('keys payload is not an object')
  }
  for (const field of KEYS_PAYLOAD_MAP_FIELDS) {
    const value = raw[field]
    if (value !== undefined && !isPlainObject(value)) {
      throw new TypeError(`keys payload field ${field} is not an object`)
    }
  }
  return raw
}

/**
 * Recursively merge two values. `b` (the "keys" side) always wins on conflict.
 * Plain objects are merged field-by-field; arrays and primitives are replaced
 * wholesale. `undefined` on either side yields the other side.
 */
export function deepMerge(a: unknown, b: unknown): unknown {
  if (b === undefined) return a
  if (a === undefined) return b
  if (isPlainObject(a) && isPlainObject(b)) {
    const out: Record<string, unknown> = { ...a }
    for (const key of Object.keys(b)) {
      out[key] = deepMerge(a[key], b[key])
    }
    return out
  }
  return b
}

/**
 * Combine the config-side enablement flag with the keys-side value for one
 * plugin ID across corePlugins, swapPlugins, pluginApiKeys, and rampPlugins.
 */
export function mergePluginInit(
  configValue: unknown,
  keysValue: unknown
): unknown {
  if (configValue === false) return false
  if (configValue === true) {
    return keysValue !== undefined ? keysValue : true
  }
  if (configValue === undefined) {
    return keysValue
  }
  // Legacy: config still carries a non-secret object (or other leftover).
  return deepMerge(configValue, keysValue)
}

export interface PluginMaps {
  corePlugins: Record<string, unknown>
  swapPlugins: Record<string, unknown>
  pluginApiKeys: Record<string, unknown>
  rampPlugins: Record<string, unknown>
}

interface ConfigFiles {
  [key: string]: unknown
  corePlugins?: Record<string, unknown>
  swapPlugins?: Record<string, unknown>
  pluginApiKeys?: Record<string, unknown>
  rampPlugins?: Record<string, unknown>
}

interface KeysFiles {
  [key: string]: unknown
  pluginApiKeys?: Record<string, unknown>
  rampPlugins?: Record<string, unknown>
  globalKeys?: Record<string, unknown>
}

/**
 * Nest flat partner-key fields into `globalKeys` and drop them from the top
 * level. Accepts cleaned `asKeysJson` output or a remote/cache overlay.
 */
export function nestGlobalKeys(keysJson: Record<string, unknown>): RuntimeKeys {
  const nested: Record<string, unknown> = {
    ...(isPlainObject(keysJson.globalKeys) ? keysJson.globalKeys : {})
  }
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(keysJson)) {
    if (key === 'globalKeys') continue
    if (GLOBAL_KEY_NAMES.includes(key)) {
      if (!(key in nested) || nested[key] == null) nested[key] = value
      continue
    }
    out[key] = value
  }
  out.globalKeys = nested
  return out as unknown as RuntimeKeys
}

/**
 * Resolve the four plugin maps from immutable CONFIG and the current KEYS.
 */
export function resolvePluginMaps(
  configJson: ConfigJson | Record<string, unknown>,
  keysJson: RuntimeKeys | Record<string, unknown>
): PluginMaps {
  const config = asUnknownMap(configJson) as ConfigFiles
  const keys = asUnknownMap(keysJson) as KeysFiles

  const configCore = asUnknownMap(config.corePlugins ?? {})
  const configSwap = asUnknownMap(config.swapPlugins ?? {})
  const configApiKeys = asUnknownMap(config.pluginApiKeys ?? {})
  const configRamp = asUnknownMap(config.rampPlugins ?? {})
  const keysApiKeys = asUnknownMap(keys.pluginApiKeys ?? {})
  const keysRamp = asUnknownMap(keys.rampPlugins ?? {})

  const coreIds = new Set(Object.keys(configCore))
  const swapIds = new Set(Object.keys(configSwap))

  const corePlugins: Record<string, unknown> = {}
  for (const id of coreIds) {
    corePlugins[id] = mergePluginInit(configCore[id], keysApiKeys[id])
  }

  const swapPlugins: Record<string, unknown> = {}
  for (const id of swapIds) {
    swapPlugins[id] = mergePluginInit(configSwap[id], keysApiKeys[id])
  }

  const pluginApiKeys: Record<string, unknown> = {}
  const apiKeyIds = new Set([
    ...Object.keys(configApiKeys),
    ...Object.keys(keysApiKeys)
  ])
  for (const id of apiKeyIds) {
    if (coreIds.has(id) || swapIds.has(id)) continue
    pluginApiKeys[id] = mergePluginInit(configApiKeys[id], keysApiKeys[id])
  }

  const rampPlugins: Record<string, unknown> = {}
  const rampIds = new Set([
    ...Object.keys(configRamp),
    ...Object.keys(keysRamp)
  ])
  for (const id of rampIds) {
    rampPlugins[id] = mergePluginInit(configRamp[id], keysRamp[id])
  }

  return { corePlugins, swapPlugins, pluginApiKeys, rampPlugins }
}

/**
 * Truncate a single secret to its first 8 characters so it can be shown for
 * debugging without leaking the full value. Non-strings are returned as-is.
 */
export function redactKey(value: unknown): unknown {
  if (typeof value === 'string') return value.slice(0, 8)
  return value
}

/**
 * Recursively redact every string within a value to at most 8 characters.
 */
export function redactValue(value: unknown): unknown {
  if (typeof value === 'string') return value.slice(0, 8)
  if (Array.isArray(value)) return value.map(redactValue)
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(value)) {
      out[key] = redactValue(item)
    }
    return out
  }
  return value
}

export type { GlobalKeys }
