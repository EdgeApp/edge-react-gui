// Helpers for merging config.json enablement with keys.json secrets into
// resolved plugin maps, and for deep-merging remote key overlays.

import { asObject, asUnknown } from 'cleaners'

import {
  type ConfigJson,
  GLOBAL_KEY_NAMES,
  type GlobalKeys,
  type RuntimeKeys
} from './configKeysSchema'

/** Open string-keyed object; fails closed on non-objects (unlike a soft coerce). */
const asUnknownMap = asObject(asUnknown)

export function isPlainObject(
  value: unknown
): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Maps inside a keys payload that must stay objects to merge safely. */
const KEYS_PAYLOAD_MAP_FIELDS = [
  'corePlugins',
  'swapPlugins',
  'guiApiKeys',
  'rampPlugins',
  'globalKeys'
]
const FORBIDDEN_MERGE_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

/**
 * Structural check on a keys payload about to be merged into KEYS, whichever
 * tier it came from: a signed infoRollup `appKeys` overlay or the on-disk cache.
 *
 * Deliberately not `asKeysJson`. That cleaner defaults every absent field, and
 * these payloads are partial overlays, so defaulting would let a sparse one
 * blank out baked-in values during the merge.
 */
export function asMergeableKeys(raw: unknown): Record<string, unknown> {
  if (!isPlainObject(raw)) {
    throw new TypeError('keys payload is not an object')
  }
  for (const key of Object.keys(raw)) {
    if (FORBIDDEN_MERGE_KEYS.has(key)) {
      throw new TypeError(`keys payload contains forbidden key ${key}`)
    }
  }
  for (const field of KEYS_PAYLOAD_MAP_FIELDS) {
    const value = raw[field]
    if (value !== undefined && !isPlainObject(value)) {
      throw new TypeError(`keys payload field ${field} is not an object`)
    }
    if (isPlainObject(value)) {
      for (const key of Object.keys(value)) {
        if (FORBIDDEN_MERGE_KEYS.has(key)) {
          throw new TypeError(`keys payload contains forbidden key ${key}`)
        }
      }
    }
  }
  return raw
}

/** True for `{}`, which carries no opinion about anything. */
function isEmptyObject(value: unknown): boolean {
  return isPlainObject(value) && Object.keys(value).length === 0
}

/**
 * Recursively merge two values. `b` always wins on conflict, including when it
 * is `false`: `scripts/deploy.ts` merges a branch's override block over a
 * config file, and `false` is how a branch turns a plugin or flag off.
 *
 * Do not use this for a remote or cached keys overlay. That direction must not
 * be able to delete anything, so it goes through `mergeKeysOverlay`.
 *
 * Plain objects are merged field-by-field; arrays and primitives are replaced
 * wholesale. `undefined` on either side yields the other side.
 */
export function deepMerge(a: unknown, b: unknown): unknown {
  if (b === undefined) return a
  if (a === undefined) return b
  if (isPlainObject(a) && isPlainObject(b)) {
    const out: Record<string, unknown> = { ...a }
    for (const key of Object.keys(b)) {
      if (FORBIDDEN_MERGE_KEYS.has(key)) continue
      out[key] = deepMerge(a[key], b[key])
    }
    return out
  }
  return b
}

/**
 * Merge a keys overlay (remote infoRollup `appKeys`, or the disk cache) onto
 * the values baked into the build. The overlay supplies secrets and may never
 * remove them, so unlike `deepMerge` it cannot replace something with nothing:
 *
 * - `undefined`, `false`, `null`, `''` and `{}` all mean "no opinion" and leave
 *   the baked value untouched.
 * - any other non-object (a string, a number) arriving where the build holds
 *   an init object is ignored, rather than flattening the object to a scalar.
 *
 * Without this an overlay saying `swapPlugins.changenow: false` would replace
 * the baked `{ apiKey: '…' }` with `false`, wiping the credential before
 * `mergePluginInit` ever sees it. Only `config.json` disables a plugin.
 */
export function mergeKeysOverlay(baked: unknown, overlay: unknown): unknown {
  if (
    overlay === undefined ||
    overlay === false ||
    overlay === null ||
    overlay === '' ||
    isEmptyObject(overlay)
  ) {
    return baked
  }
  if (isPlainObject(baked) && !isPlainObject(overlay)) return baked
  if (baked === undefined) return overlay
  if (isPlainObject(baked) && isPlainObject(overlay)) {
    const out: Record<string, unknown> = { ...baked }
    for (const key of Object.keys(overlay)) {
      if (FORBIDDEN_MERGE_KEYS.has(key)) continue
      out[key] = mergeKeysOverlay(baked[key], overlay[key])
    }
    return out
  }
  return overlay
}

/**
 * Combine the config-side enablement flag with the keys-side value for one
 * plugin ID across corePlugins, swapPlugins, guiApiKeys, and rampPlugins.
 */
export function mergePluginInit(
  configValue: unknown,
  keysValue: unknown
): unknown {
  if (configValue === false) return false
  // Keys are never an off switch: only config.json can disable a plugin. A
  // remote/cache overlay that says `false`, or hands back `{}`, contributes
  // nothing and leaves the config-side value exactly as it was. `deepMerge`
  // applies the same rule one level down.
  if (keysValue === false || keysValue === null || isEmptyObject(keysValue)) {
    return configValue
  }
  if (configValue === true) {
    // `null` is already handled above, so `??` only catches `undefined` here.
    return keysValue ?? true
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
  guiApiKeys: Record<string, unknown>
  rampPlugins: Record<string, unknown>
}

interface ConfigFiles {
  [key: string]: unknown
  corePlugins?: Record<string, unknown>
  swapPlugins?: Record<string, unknown>
  guiApiKeys?: Record<string, unknown>
  rampPlugins?: Record<string, unknown>
}

interface KeysFiles {
  [key: string]: unknown
  corePlugins?: Record<string, unknown>
  swapPlugins?: Record<string, unknown>
  guiApiKeys?: Record<string, unknown>
  rampPlugins?: Record<string, unknown>
  globalKeys?: Record<string, unknown>
}

/**
 * Nest flat partner-key fields into `globalKeys` and drop them from the top
 * level. Accepts cleaned `asKeysJson` output or a remote/cache overlay.
 *
 * Precedence is value-based, not presence-based: an empty nested slot loses to
 * a real flat value. `asGlobalKeys` defaults every missing field to `''`, so a
 * `keys.json` that has been through a `cleaner-config` round-trip (which
 * `scripts/configure.ts` performs on every `npm run prepare`) carries a full
 * `globalKeys` block of empty strings. Treating those as "already set" would
 * permanently shadow the real flat values still sitting at the top level.
 */
export function nestGlobalKeys(keysJson: Record<string, unknown>): RuntimeKeys {
  const nested: Record<string, unknown> = {
    ...(isPlainObject(keysJson.globalKeys) ? keysJson.globalKeys : {})
  }
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(keysJson)) {
    if (key === 'globalKeys') continue
    if (GLOBAL_KEY_NAMES.includes(key)) {
      // `asKeysJson` accepts the flat fields without defaults, so an absent
      // one arrives as undefined and must not blank a nested value.
      if (value === undefined) continue
      const slot = nested[key]
      if (!(key in nested) || slot == null || slot === '') nested[key] = value
      continue
    }
    out[key] = value
  }
  out.globalKeys = nested
  return out as unknown as RuntimeKeys
}

function mergePluginMap(
  configMap: Record<string, unknown>,
  keysMap: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  const ids = new Set([...Object.keys(configMap), ...Object.keys(keysMap)])
  for (const id of ids) {
    out[id] = mergePluginInit(configMap[id], keysMap[id])
  }
  return out
}

/**
 * Resolve the four plugin maps from immutable CONFIG and the current KEYS.
 * Each map unions IDs from both sides and merges per ID. Extra remote IDs on
 * corePlugins do not register a new engine: `corePlugins.ts` is a table.
 */
export function resolvePluginMaps(
  configJson: ConfigJson | Record<string, unknown>,
  keysJson: RuntimeKeys | Record<string, unknown>
): PluginMaps {
  const config = asUnknownMap(configJson) as ConfigFiles
  const keys = asUnknownMap(keysJson) as KeysFiles

  return {
    corePlugins: mergePluginMap(
      asUnknownMap(config.corePlugins ?? {}),
      asUnknownMap(keys.corePlugins ?? {})
    ),
    swapPlugins: mergePluginMap(
      asUnknownMap(config.swapPlugins ?? {}),
      asUnknownMap(keys.swapPlugins ?? {})
    ),
    guiApiKeys: mergePluginMap(
      asUnknownMap(config.guiApiKeys ?? {}),
      asUnknownMap(keys.guiApiKeys ?? {})
    ),
    rampPlugins: mergePluginMap(
      asUnknownMap(config.rampPlugins ?? {}),
      asUnknownMap(keys.rampPlugins ?? {})
    )
  }
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
