import { asObject, asOptional, asString, asUnknown } from 'cleaners'

import { isPlainObject } from '../../util/predicates'
import { configSearchPaths, readJsonConfig } from './readJsonConfig'

const asKeysConfig = asObject({
  edgeApiKey: asOptional(asString, ''),
  edgeApiSecret: asOptional(asString),
  pluginApiKeys: asOptional(asObject(asUnknown), () => ({}))
})

/**
 * Derived from the cleaner. The `Cleaner<KeysConfig>` annotation it replaces
 * hid what the cleaner really returns — `edgeApiKey` has a `''` fallback, so
 * it is always present, which the interface happened to agree with only by
 * hand.
 */
export type KeysConfig = ReturnType<typeof asKeysConfig>

function makeDefaultKeys(): KeysConfig {
  return { edgeApiKey: '', edgeApiSecret: undefined, pluginApiKeys: {} }
}

/**
 * Merge plugin settings with the earlier search path taking precedence.
 * Object values merge field-by-field so a CLI fallback key can supplement,
 * but cannot replace, GUI config such as Changelly's partnerId.
 */
export function mergePluginApiKeys(
  preferred: Record<string, unknown>,
  fallback: Record<string, unknown>
): Record<string, unknown> {
  const out = { ...fallback }
  for (const [pluginId, preferredValue] of Object.entries(preferred)) {
    const fallbackValue = out[pluginId]
    out[pluginId] =
      isPlainObject(preferredValue) && isPlainObject(fallbackValue)
        ? { ...fallbackValue, ...preferredValue }
        : preferredValue
  }
  return out
}

/** Where loadKeys looks, in order. */
export function keysSearchPaths(): string[] {
  return configSearchPaths('keys.json')
}

function readKeysFile(path: string): KeysConfig | null {
  return readJsonConfig(path, asKeysConfig, 'keys.json')
}

/**
 * Loads keys.json from (in order):
 * 1. ./keys.json
 * 2. ~/.edge-cli/keys.json
 *
 * Missing files are skipped. Present but invalid JSON/cleaner failures throw
 * so misconfiguration is not silently treated as empty defaults. A file that
 * parses but carries no `edgeApiKey` — such as the GUI's own repo-root
 * keys.json — does not shadow a later file that does have one.
 *
 * Plugin secrets (including Monero LWS `edgeApiKey`) come from signed
 * infoRollup `appKeys` at engine boot, not from leftover `env.json`
 * `MONERO_INIT`.
 */
export function loadKeys(): KeysConfig {
  const out = makeDefaultKeys()
  let foundApiKey = false

  for (const path of keysSearchPaths()) {
    const parsed = readKeysFile(path)
    if (parsed == null) continue
    out.pluginApiKeys = mergePluginApiKeys(
      out.pluginApiKeys,
      parsed.pluginApiKeys
    )
    if (!foundApiKey && parsed.edgeApiKey !== '') {
      out.edgeApiKey = parsed.edgeApiKey
      out.edgeApiSecret = parsed.edgeApiSecret
      foundApiKey = true
    }
  }

  return out
}

/**
 * The cleaner itself, for the drift test.
 *
 * `configSubsets.test.ts` feeds it what the app's own `config.json` /
 * `keys.json` cleaner produces, so this narrower subset cannot stop
 * accepting the file the app writes. The engine deliberately does not use
 * the app's `makeConfig` loader, which fills defaults and writes the file
 * back — a daemon asked to read a user's keys must not rewrite them.
 */
export const asKeysConfigForTests = asKeysConfig
