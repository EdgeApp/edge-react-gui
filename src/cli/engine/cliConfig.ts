import { asBoolean, asObject, asOptional, asString } from 'cleaners'
import os from 'os'
import { join, resolve } from 'path'

import { errorMessage } from '../../util/errorMessage'
import { readJsonConfig } from './readJsonConfig'

/**
 * Every key `edge-cli.conf` accepts, and nothing else.
 *
 * A cleaner that accepts a setting is what tells a user it works, so it
 * takes no key that nothing reads. No `authServer`: `-t` is the supported
 * way to reach the tester servers. No `username` or `password`: the
 * documented way to keep credentials off a command line is
 * `EDGE_CLI_PASSWORD`, which every other secret flag also has, and not a
 * file this loader does not even check the mode of. `docs/EDGE_CLI.md`
 * lists these keys, so the cleaner is not the only answer to what the file
 * takes — which matters because `asObject` without `.withRest` drops an
 * unknown key silently, so the file cannot report one back.
 */
const asCliConfig = asObject({
  apiKey: asOptional(asString),
  appId: asOptional(asString),
  directory: asOptional(asString),
  locale: asOptional(asString),
  testMode: asOptional(asBoolean),
  // A second spelling of `directory`, and nothing more: both halves read it
  // as `args.directory ?? fileConfig.directory ?? fileConfig.workingDir`.
  // It is not the base for relative paths — those resolve against
  // `process.cwd()`, which nothing here changes — so setting it to give
  // `--out` a scratch directory silently selects a second profile with an
  // empty login stash.
  workingDir: asOptional(asString)
})

/** Derived from the cleaner, so the two cannot drift. */
export type CliConfig = ReturnType<typeof asCliConfig>

/**
 * An explicit `-c` naming a file that is not there.
 *
 * Typed, because the client has to report it as the argv mistake it is: a
 * plain `Error` would fall through `printError`'s generic arm, so
 * `edge-cli -c /typo/edge-cli.conf account-info` would print
 * `{"code":"INTERNAL_ERROR","status":500}` and exit 1, while every
 * neighbouring bad-argument path — `clientTimeoutMs`, `clientTcpPort` —
 * reports a usage error and exits 2. The engine has its own
 * `EngineUsageError` for the same reason.
 */
export class CliConfigError extends Error {}

/**
 * The same load, saying which file answered.
 *
 * `engine-config` publishes it, beside the `keys.json` search path and the
 * GUI's `config.json`: this is the file that decides `directory`, `appId`,
 * `locale` and `apiKey` for a running engine. The guide devotes a section to
 * this file and says "one file decides both halves", because the client
 * forwards `-c` to the engine it spawns.
 *
 * `null` when no file was read: an absent default path is not an error, and
 * an explicit `-c` that is not there throws before this returns.
 */
export function loadConfigFrom(configPath?: string): {
  config: CliConfig
  path: string | null
} {
  const where = resolve(configPath ?? defaultConfigPath())
  let config: CliConfig | null
  try {
    config = readJsonConfig(where, asCliConfig, 'CLI config')
  } catch (error: unknown) {
    // Typed as well, for the same reason the missing file is: a config file
    // that is not JSON, or not this shape, is the caller's to fix, and the
    // plain `Error` `readJsonConfig` throws would fall through to
    // `INTERNAL_ERROR` and exit 1.
    throw new CliConfigError(errorMessage(error))
  }
  if (config != null) return { config, path: where }
  if (configPath != null) {
    throw new CliConfigError(
      `Cannot load config file "${configPath}": no such file`
    )
  }
  // Through the cleaner, so "no config file" and "an empty config file"
  // are the same value rather than two shapes.
  return { config: asCliConfig({}), path: null }
}

/** Where `-c` defaults to. */
export function defaultConfigPath(): string {
  return join(os.homedir(), '.config', 'edge-cli', 'edge-cli.conf')
}

export function loadConfig(configPath?: string): CliConfig {
  // Through `readJsonConfig`, like the two other config readers. The two
  // semantics this read needs of its own are kept in this module, where they
  // belong: an explicit `-c` that is not there is an error, and the default
  // path not being there is not.
  return loadConfigFrom(configPath).config
}

export function defaultDirectory(): string {
  return join(os.homedir(), '.config', 'edge-cli')
}
