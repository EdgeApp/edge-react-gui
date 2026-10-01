/**
 * Load GUI-style config.json (swapPlugins).
 * Searches ./config.json then ~/.edge-cli/config.json.
 */
import { asObject, asOptional, asUnknown } from 'cleaners'

import { configSearchPaths, readJsonConfig } from './readJsonConfig'

const asAppConfigFile = asObject({
  swapPlugins: asOptional(asObject(asUnknown))
})

/** Derived from the cleaner, so the two cannot drift. */
export type AppConfigFile = ReturnType<typeof asAppConfigFile>

/** Where loadAppConfig looks, in order. */
function appConfigSearchPaths(): string[] {
  return configSearchPaths('config.json')
}

function readAppConfigFile(path: string): AppConfigFile | null {
  return readJsonConfig(path, asAppConfigFile, 'config.json')
}

/**
 * Loads config.json from (in order):
 * 1. ./config.json
 * 2. ~/.edge-cli/config.json
 *
 * Missing files are skipped. Present but invalid JSON/cleaner failures throw,
 * matching loadKeys, so a typo cannot silently disable every swap plugin.
 */
export function loadAppConfig(): AppConfigFile {
  for (const path of appConfigSearchPaths()) {
    const parsed = readAppConfigFile(path)
    if (parsed != null) return parsed
  }
  return asAppConfigFile({})
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
export const asAppConfigFileForTests = asAppConfigFile
