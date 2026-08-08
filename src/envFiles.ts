// Helpers for splitting Edge configuration into a committable, non-secret
// `config.json` and a private `keys.json`, then recombining them into the
// single `ENV` object the app consumes at runtime.
//
// The runtime shape produced by `makeEnvFromFiles` matches the schema declared
// in `envConfig.ts`: top-level app/debug fields plus four plugin maps keyed by
// plugin ID (`corePlugins`, `swapPlugins`, `pluginApiKeys`, `rampPlugins`).

import type { EnvConfig } from './envConfig'

const PLUGIN_MAP_FIELDS = [
  'corePlugins',
  'swapPlugins',
  'pluginApiKeys',
  'rampPlugins'
] as const

export function isPlainObject(
  value: unknown
): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
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
 * Combine the config-side and keys-side value for a single plugin init.
 *
 * - A `false` config value keeps the plugin disabled (secrets are ignored).
 * - A `true` (or missing) config value with object secrets becomes the secret
 *   object (an object always wins over a bare boolean enablement flag).
 * - Otherwise the two values are deep-merged, with the keys side winning.
 */
export function mergePluginInit(
  configValue: unknown,
  keysValue: unknown
): unknown {
  if (configValue === false) return false
  if (
    isPlainObject(keysValue) &&
    (configValue === true || configValue === undefined)
  ) {
    return keysValue
  }
  return deepMerge(configValue, keysValue)
}

interface EnvFiles {
  [key: string]: unknown
  corePlugins?: Record<string, unknown>
  swapPlugins?: Record<string, unknown>
  pluginApiKeys?: Record<string, unknown>
  rampPlugins?: Record<string, unknown>
}

function asMap(value: unknown): Record<string, unknown> {
  return isPlainObject(value) ? value : {}
}

/**
 * Merge an already-cleaned, non-secret `config.json` object with an
 * already-cleaned secret `keys.json` object into the flat `ENV` shape. Callers
 * should pass values validated by `asConfigJson` / `asKeysJson` so each file's
 * fields (including single-run codecs such as `asBase16`) are cleaned exactly
 * once; this function only merges and does not re-run any cleaner.
 */
export function makeEnvFromFiles(
  configJson: unknown,
  keysJson: unknown
): EnvConfig {
  const config: EnvFiles = asMap(configJson)
  const keys: EnvFiles = asMap(keysJson)

  const result: Record<string, unknown> = {}

  // 1. Shallow-merge top-level, non-plugin fields (keys wins).
  for (const source of [config, keys]) {
    for (const [field, value] of Object.entries(source)) {
      if ((PLUGIN_MAP_FIELDS as readonly string[]).includes(field)) continue
      result[field] = value
    }
  }

  const configCore = asMap(config.corePlugins)
  const configSwap = asMap(config.swapPlugins)
  const configApiKeys = asMap(config.pluginApiKeys)
  const configRamp = asMap(config.rampPlugins)
  const keysApiKeys = asMap(keys.pluginApiKeys)
  const keysRamp = asMap(keys.rampPlugins)

  const coreIds = new Set(Object.keys(configCore))
  const swapIds = new Set(Object.keys(configSwap))

  // 2. Currency plugins: merge non-secret config with matching secrets.
  const corePlugins: Record<string, unknown> = {}
  for (const id of coreIds) {
    corePlugins[id] = mergePluginInit(configCore[id], keysApiKeys[id])
  }

  // 3. Swap plugins: same treatment as currency plugins.
  const swapPlugins: Record<string, unknown> = {}
  for (const id of swapIds) {
    swapPlugins[id] = mergePluginInit(configSwap[id], keysApiKeys[id])
  }

  // 4. GUI provider keys: every pluginApiKeys ID that is not a currency or swap
  //    plugin (currency/swap secrets live only inside corePlugins/swapPlugins).
  const pluginApiKeys: Record<string, unknown> = {}
  const apiKeyIds = new Set([
    ...Object.keys(configApiKeys),
    ...Object.keys(keysApiKeys)
  ])
  for (const id of apiKeyIds) {
    if (coreIds.has(id) || swapIds.has(id)) continue
    pluginApiKeys[id] = deepMerge(configApiKeys[id], keysApiKeys[id])
  }

  // 5. Ramp plugins: deep-merge config and keys per plugin ID.
  const rampPlugins: Record<string, unknown> = {}
  const rampIds = new Set([
    ...Object.keys(configRamp),
    ...Object.keys(keysRamp)
  ])
  for (const id of rampIds) {
    rampPlugins[id] = deepMerge(configRamp[id], keysRamp[id])
  }

  result.corePlugins = corePlugins
  result.swapPlugins = swapPlugins
  result.pluginApiKeys = pluginApiKeys
  result.rampPlugins = rampPlugins

  return result as unknown as EnvConfig
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
 * Recursively redact every string within a value (objects, arrays, and nested
 * structures) to at most 8 characters. Useful for logging a whole keys file.
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
