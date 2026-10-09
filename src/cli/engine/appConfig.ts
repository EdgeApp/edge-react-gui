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
type AppConfigFile = ReturnType<typeof asAppConfigFile>

/** Where `loadAppConfig` looks, in order. */
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
 *
 * A file that parses but declares no `swapPlugins` does not shadow a later
 * one that does — the same latch `loadKeys` applies to `edgeApiKey`, and for
 * the same reason. `asAppConfigFile` drops unknown keys, so *any*
 * `config.json` in the working directory parsed to `{}` and was returned:
 * a user who disabled a swap plugin in `~/.edge-cli/config.json` got it
 * enabled again by running from a directory that happened to hold an
 * unrelated `config.json`, with nothing said.
 *
 * The throw stays for a file whose `swapPlugins` is the wrong *type*: a typo
 * in the user's own file would otherwise silently re-enable every plugin
 * they turned off, which is what it is for. `readJsonConfig` names the path,
 * so a `config.json` belonging to something else is diagnosable from the
 * message.
 */
export function loadAppConfig(): AppConfigFile {
  return loadAppConfigFrom().config
}

/**
 * The same load, saying which file answered.
 *
 * `engine-config` publishes it. A daemon inherits the working directory of
 * whichever command spawned it and searches `./config.json` first, so two
 * invocations with identical flags from different directories hash to the
 * same profile and are served by one engine — running on whichever
 * configuration that first `cd` happened to be in, with nothing reporting
 * which.
 */
export function loadAppConfigFrom(): {
  config: AppConfigFile
  path: string | null
} {
  for (const path of appConfigSearchPaths()) {
    const parsed = readAppConfigFile(path)
    if (parsed?.swapPlugins != null) return { config: parsed, path }
  }
  return { config: asAppConfigFile({}), path: null }
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
