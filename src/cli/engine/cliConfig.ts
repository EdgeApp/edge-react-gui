import { asBoolean, asObject, asOptional, asString } from 'cleaners'
import os from 'os'
import { join, resolve } from 'path'

import { readJsonConfig } from './readJsonConfig'

/**
 * Every key `edge-cli.conf` accepts, and nothing else.
 *
 * A cleaner that accepts a setting is what tells a user it works, so three
 * keys that nothing read had to go: `authServer`, `username` and `password`.
 * `authServer` read as the one knob for pointing the CLI somewhere other
 * than production, and a config file carrying it was served by an engine
 * silently using Edge's production login server, with `engine-config`
 * reporting `servers: {}` — `-t` is the supported way to reach the tester
 * servers. `username`/`password` read as the way to keep credentials off a
 * command line, which `docs/EDGE_CLI.md` tells the user to do, and a user who
 * moved them here got no login *and* a password sitting in a plaintext file
 * for nothing; the documented path is `EDGE_CLI_PASSWORD`, which every other
 * secret flag also has, and not a file this loader does not even check the
 * mode of. `docs/EDGE_CLI.md` lists these keys now, so the cleaner is not
 * the only answer to what the file takes — which matters because `asObject`
 * without `.withRest` drops an unknown key silently, so the file cannot
 * report one back.
 */
const asCliConfig = asObject({
  apiKey: asOptional(asString),
  appId: asOptional(asString),
  directory: asOptional(asString),
  locale: asOptional(asString),
  testMode: asOptional(asBoolean),
  // A second spelling of `directory`, and nothing more: both halves read it
  // as `args.directory ?? fileConfig.directory ?? fileConfig.workingDir`.
  // The guide described it as the base for relative paths, which it is not
  // — those resolve against `process.cwd()`, which nothing here changes —
  // so someone setting it to give `--out` a scratch directory silently got
  // a second profile with an empty login stash.
  workingDir: asOptional(asString)
})

/** Derived from the cleaner, so the two cannot drift. */
export type CliConfig = ReturnType<typeof asCliConfig>

/**
 * An explicit `-c` naming a file that is not there.
 *
 * Typed, because the client has to report it as the argv mistake it is: a
 * plain `Error` fell through `printError`'s generic arm, so
 * `edge-cli -c /typo/edge-cli.conf account-list` printed
 * `{"code":"INTERNAL_ERROR","status":500}` and exited 1 with no usage line,
 * while every neighbouring bad-argument path — `clientTimeoutMs`,
 * `clientTcpPort` — reports a usage error and exits 2. The engine has its
 * own `EngineUsageError` for the same reason.
 */
export class CliConfigError extends Error {}

/**
 * The same load, saying which file answered.
 *
 * `engine-config` publishes it. The guide devotes a section to this file and
 * says "one file decides both halves", because the client forwards `-c` to
 * the engine it spawns — and `configFiles` named the `keys.json` search path
 * and the GUI's `config.json` and not this one, so the file that actually
 * decided `directory`, `appId`, `locale` and `apiKey` for a running engine
 * was the one thing invisible in the call whose stated job is to say which
 * configuration it is running on.
 *
 * `null` when no file was read: an absent default path is not an error, and
 * an explicit `-c` that is not there throws before this returns.
 */
export function loadConfigFrom(configPath?: string): {
  config: CliConfig
  path: string | null
} {
  const where = resolve(configPath ?? defaultConfigPath())
  const config = readJsonConfig(where, asCliConfig, 'CLI config')
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
  // Through `readJsonConfig`, like the two other config readers. This was a
  // third hand-rolled variant of the same read — its own `readFileSync`, its
  // own wording, its own parse — which is what that module's docblock said
  // it had replaced. The two semantics it does need are kept here, where
  // they belong: an explicit `-c` that is not there is an error, and the
  // default path not being there is not.
  return loadConfigFrom(configPath).config
}

export function defaultDirectory(): string {
  return join(os.homedir(), '.config', 'edge-cli')
}
