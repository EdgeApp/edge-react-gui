import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

import { localeTagsMatch } from '../../locales/nodeLocale'
import { getDetectedLocale } from '../bootNodeLocale'
import { defaultDirectory } from '../engine/cliConfig'
import {
  canonicalDirectory,
  ensureRunDir,
  profileHash,
  type ProfileKey,
  socketPathFor
} from '../engine/discovery'
import { ApiClient } from './apiClient'

/**
 * The engine could not be reached or could not be started.
 *
 * A type rather than a message, because `output.ts` maps this to the
 * documented exit code 7 and used to do it with a regex over the error's
 * prose — which missed cases and would silently change the published
 * contract on a reword.
 */
export class EngineUnavailableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EngineUnavailableError'
  }
}

/**
 * Quote one argument for a shell, so a printed command can be pasted.
 *
 * The `--no-spawn` hint interpolated the directory raw, and `-d` is never
 * absent because it defaults to `~/.config/edge-cli`. A path with a space
 * printed as `-d /Users/you/My Dir`, which the engine reads as `-d
 * /Users/you/My` plus an unknown argument — so the advice either failed
 * outright or started an engine under a different profile hash.
 */
function shellQuote(value: string): string {
  if (/^[A-Za-z0-9_@%+=:,./-]+$/.test(value)) return value
  return `'${value.replace(/'/g, `'\\''`)}'`
}

/** Last few KB of the spawned engine's output, for error messages. */
function readTail(file: string, maxBytes: number): string {
  try {
    const text = fs.readFileSync(file, 'utf8').trimEnd()
    if (text === '') return ''
    return text.length > maxBytes ? text.slice(-maxBytes) : text
  } catch {
    return ''
  }
}

export interface EnsureEngineOpts extends ProfileKey {
  /** Serve an in-process fake world instead of a login server. */
  fake?: boolean
  /**
   * An API key the caller gave *explicitly*, with `-k`.
   *
   * Only the explicit flag: a key that came from the config file is not
   * forwarded, because the engine reads the same file itself and because
   * `makeCoreContext` reads an explicit key as an operator override that
   * turns off the keys.json secret and the native HMAC signer.
   */
  apiKey?: string
  /**
   * The config file the caller named with `-c`.
   *
   * Forwarded, because without it the spawned engine read the *default*
   * config instead. `testMode` lives in that file and feeds the profile
   * hash, so the two halves computed different hashes, the client polled a
   * socket the engine never bound, and the command died after the full
   * 30-second spawn timeout leaving a detached engine behind.
   */
  configPath?: string
  noSpawn?: boolean
  tcpPort?: number | null
}

async function sleep(ms: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, ms))
}

async function pingEngine(socketPath: string): Promise<boolean> {
  try {
    const client = new ApiClient({ socketPath, timeoutMs: 3000 })
    await client.get('/engine/status')
    return true
  } catch {
    return false
  }
}

export async function warnIfEngineLocaleDiffers(
  client: ApiClient
): Promise<void> {
  try {
    const status = await client.get<{ locale?: string }>('/engine/status')
    const wanted = getDetectedLocale().languageTag
    if (
      status.locale != null &&
      status.locale !== '' &&
      !localeTagsMatch(status.locale, wanted)
    ) {
      console.error(
        `[edge-cli] Warning: engine locale is ${status.locale}; this client requested ${wanted}. Using the engine locale.`
      )
    }
  } catch {
    // Status is optional for locale mismatch; spend/login still work.
  }
}

/** How long to wait for a spawned engine to answer. */
const SPAWN_TIMEOUT_MS = 30_000

/**
 * Make sure an engine is listening for this profile.
 *
 * Returns nothing. Its one caller is `ApiClient`'s `onConnectFail`, which
 * discards the result and retries the request — so reading the run file back
 * bought nothing and cost a failure mode: `Engine is up but run file is
 * missing` killed the command on a narrow but real race, where the socket
 * answers before `engine.json` is visible. The socket answering *is* the
 * readiness signal, which is what `pingEngine` tests.
 */
export async function ensureEngine(opts: EnsureEngineOpts): Promise<void> {
  const profile = profileHash({
    appId: opts.appId,
    directory: opts.directory,
    testMode: opts.testMode,
    loginServer: opts.loginServer
  })
  const socketPath = socketPathFor(profile)

  if (await pingEngine(socketPath)) return

  // Resolve engine entry relative to this source file or the package root.
  // The sibling bundle comes first. Rollup flattens src/cli into lib/edgeCli.js,
  // so in a built or installed tree (npm, Homebrew's libexec, /usr/lib/edgecli)
  // `__dirname` is the package's `lib/` and its sibling is lib/edgeEngine.js —
  // while `../engine/index.ts` resolves above the package and the cwd
  // candidates point at whatever directory the user's shell happens to be in.
  // Running from source it cannot false-positive: `__dirname` is
  // src/cli/client, which has no edgeEngine.js.
  const candidates = [
    path.resolve(__dirname, 'edgeEngine.js'),
    path.resolve(__dirname, '../engine/index.ts'),
    path.resolve(process.cwd(), 'src/cli/engine/index.ts'),
    path.resolve(process.cwd(), 'lib/edgeEngine.js')
  ]
  const engineEntry = candidates.find(p => {
    try {
      return fs.existsSync(p)
    } catch {
      return false
    }
  })
  if (engineEntry == null) {
    // An `EngineUnavailableError`, not a bare one: a broken or partial
    // install is exactly the "could not connect to or spawn the engine"
    // condition the published exit-code table assigns 7, and the generic
    // `Error` arm reported it as `INTERNAL_ERROR` and exit 1, which a
    // wrapper script branching on 7 mis-handles.
    throw new EngineUnavailableError(
      `Could not find edge-engine entry. Tried:\n${candidates
        .map(p => `  - ${p}`)
        .join('\n')}`
    )
  }

  // One list, so the flags that reach the child and the flags the
  // `--no-spawn` hint prints cannot drift. They had: the hint omitted `-k`,
  // `--tcp`, `-c` and `--locale`, so it told an operator to start an engine
  // without the key or the config file they had just supplied.
  const engineFlags: string[] = []
  if (opts.testMode) engineFlags.push('-t')
  if (opts.fake === true) engineFlags.push('--fake')
  if (opts.directory !== '' && opts.directory !== defaultDirectory()) {
    // The canonical form, so the directory the child opens is the same
    // string the profile hash was taken over. Forwarding the raw argv value
    // let the two disagree.
    engineFlags.push('-d', canonicalDirectory(opts.directory))
  }
  if (opts.appId !== '') engineFlags.push('-a', opts.appId)
  if (opts.configPath != null && opts.configPath !== '') {
    engineFlags.push('-c', opts.configPath)
  }
  if (opts.tcpPort != null) engineFlags.push(`--tcp=${opts.tcpPort}`)
  const applied = getDetectedLocale()
  engineFlags.push(`--locale=${applied.languageTag}`)

  if (opts.noSpawn === true) {
    // The hint has to name *this* profile's flags. A hardcoded
    // `npm run engine -- -t` started an engine on a different profile hash
    // for anyone not on the default test profile, so the next command still
    // found nothing listening. It also has to name a command the reader can
    // actually run: `npm run engine` only exists inside this checkout, and
    // `docs/EDGE_CLI.md` tells people to run `node lib/edgeCli.js`.
    const runner = engineEntry.endsWith('.js')
      ? `${shellQuote(process.execPath)} ${shellQuote(engineEntry)}`
      : 'npm run engine --'
    const printed = engineFlags.map(shellQuote).join(' ')
    throw new EngineUnavailableError(
      `Engine is not running for profile ${profile} (socket ${socketPath}). Start it with: ${runner}${
        printed === '' ? '' : ` ${printed}`
      }`
    )
  }

  const args = engineEntry.endsWith('.js')
    ? [engineEntry, ...engineFlags]
    : ['-r', 'sucrase/register', engineEntry, ...engineFlags]

  // The core data directory holds the login stashes — `pin2Key`, `otpKey`,
  // and the password and recovery boxes — so it is `0700` like every other
  // root this CLI owns. Without a mode it was `0755` under a default umask
  // and disklet then wrote `logins/*.json` at `0644`, readable by every
  // other local user. `chmodSync` as well, because an earlier run may have
  // created it laxer.
  try {
    fs.mkdirSync(opts.directory, { recursive: true, mode: 0o700 })
  } catch {
    // ignore
  }
  try {
    fs.chmodSync(opts.directory, 0o700)
  } catch {
    // ignore
  }

  // Capture the child's output: a detached engine that dies during startup
  // (bad keys.json, plugin load failure) would otherwise fail silently and
  // surface only as a spawn timeout.
  const startupLog = path.join(ensureRunDir(profile), 'engine-startup.log')
  // 0600 like its siblings: it captures the engine's stdout/stderr, which
  // includes paths and, on a failure, whatever the engine was doing.
  const logFd = fs.openSync(startupLog, 'w', 0o600)
  const child = spawn(process.execPath, args, {
    detached: true,
    stdio: ['ignore', logFd, logFd],
    env: {
      ...process.env,
      EDGE_CLI_LOCALE: applied.languageTag,
      // Not on argv: `ps` shows a command line to every user on the host,
      // and this is a credential. The engine reads it as an explicit `-k`.
      ...(opts.apiKey != null && opts.apiKey !== ''
        ? { EDGE_CLI_API_KEY: opts.apiKey }
        : {})
    }
  })
  // An unhandled `'error'` on a ChildProcess is an uncaught exception — a
  // spawn failure under fork pressure, or a `process.execPath` that moved
  // after a Node upgrade — and it would kill the client with a raw Node stack
  // instead of the JSON envelope every other failure produces, outside
  // `main().catch` because it never becomes a rejection.
  let spawnError: Error | undefined
  let exitInfo: string | undefined
  child.once('error', (error: Error) => {
    spawnError = error
  })
  // An engine that dies during startup — a bad keys.json, a plugin that
  // throws, the "already running" exit — otherwise costs the caller the whole
  // spawn timeout before anyone looks at the log.
  child.once('exit', (code, signal) => {
    exitInfo =
      signal != null ? `killed by ${signal}` : `exited with code ${code ?? 0}`
  })
  child.unref()
  fs.closeSync(logFd)

  const start = Date.now()
  while (Date.now() - start < SPAWN_TIMEOUT_MS) {
    await sleep(250)
    if (spawnError != null) {
      throw new EngineUnavailableError(
        `Could not start the engine: ${spawnError.message} (${process.execPath})`
      )
    }
    if (exitInfo != null && !(await pingEngine(socketPath))) {
      const earlyTail = readTail(startupLog, 2000)
      throw new EngineUnavailableError(
        `The engine ${exitInfo} during startup (profile ${profile}).` +
          (earlyTail === ''
            ? ` No engine output; see ${startupLog}.`
            : `\n--- engine output (${startupLog}) ---\n${earlyTail}`)
      )
    }
    if (await pingEngine(socketPath)) return
  }

  const tail = readTail(startupLog, 2000)
  throw new EngineUnavailableError(
    `Timed out waiting for engine to start (profile ${profile})${
      exitInfo != null ? `; the process ${exitInfo}` : ''
    }.` +
      (tail === ''
        ? ` No engine output; see ${startupLog}.`
        : `\n--- engine output (${startupLog}) ---\n${tail}`)
  )
}
