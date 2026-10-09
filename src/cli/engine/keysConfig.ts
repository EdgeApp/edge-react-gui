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

/**
 * The keys a run has when no `keys.json` was found.
 *
 * `asKeysConfig({})`, not a hand-written triple: the cleaner already
 * declares every fallback, and restating them is a second place for them to
 * disagree. `appConfig.ts` and `cliConfig.ts` both spell it this way.
 */
function makeDefaultKeys(): KeysConfig {
  return asKeysConfig({})
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
  return loadKeysFrom().keys
}

/**
 * The same load, saying which files it read.
 *
 * `engine-config` publishes them, because a daemon inherits the working
 * directory of whichever command spawned it and `./keys.json` is searched
 * first — so two invocations with identical flags from different directories
 * are served by one engine running on one checkout's `edgeApiKey`,
 * `edgeApiSecret` and every plugin's init options, with nothing saying
 * which. The paths only: the values are the secrets.
 */
export function loadKeysFrom(): { keys: KeysConfig; paths: string[] } {
  const out = makeDefaultKeys()
  const paths: string[] = []
  let foundApiKey = false

  for (const path of keysSearchPaths()) {
    const parsed = readKeysFile(path)
    if (parsed == null) continue
    paths.push(path)
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

  return { keys: out, paths }
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
