import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

import { resolveLocaleTableOrEnglish } from '../../locales/localeKeys'
import { sleep } from '../../util/sleep'
import { getDetectedLocale } from '../bootNodeLocale'
import { defaultDirectory } from '../engine/cliConfig'
import {
  canonicalDirectory,
  ENGINE_EXIT_ALREADY_RUNNING,
  ensureRunDir,
  profileHash,
  type ProfileKey,
  socketPathFor
} from '../engine/discovery'
import { errorMessage } from '../engine/errors'
import { allSecretEnvNames } from '../secretFlags'
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
  /** Test seam; see `EnsureEngineDeps`. Production leaves it unset. */
  deps?: EnsureEngineDeps
  noSpawn?: boolean
  tcpPort?: number | null
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

/**
 * Warn when the engine answers in a different language than this shell asked
 * for.
 *
 * The comparison is the *table* each tag selects, not the tags: `en` and
 * `en-US` both answer in English and `de` and `de-DE` both merge `de.json`,
 * so comparing tags warned about a difference with no effect — and because
 * the hook is `onFirstResponse`, once per command for the life of that
 * engine. A bare `LANG=en`, which is what a container or a CI shell tends to
 * set, was enough to produce it.
 *
 * `resolveLocaleTableOrEnglish`, because a tag with no table is English too:
 * Edge ships twelve, so `LANG=nl_NL.UTF-8` against a cron shell's `en-US`
 * compared `undefined` with `'en'` and warned, on every command, about two
 * engines answering the same language.
 */
export async function warnIfEngineLocaleDiffers(
  client: ApiClient
): Promise<void> {
  try {
    const status = await client.get<{ locale?: string }>('/engine/status')
    const wanted = getDetectedLocale().languageTag
    if (
      status.locale != null &&
      status.locale !== '' &&
      resolveLocaleTableOrEnglish(status.locale) !==
        resolveLocaleTableOrEnglish(wanted)
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
 * When the appended startup log is trimmed instead of grown.
 *
 * `removeRunArtifacts` deletes it on an ordinary stop, so this only bounds a
 * profile whose engine keeps failing to start — the case where the log is
 * being read, so it should hold the recent attempts rather than all of them.
 */
const STARTUP_LOG_MAX_BYTES = 256 * 1024

/** Whether the appended startup log has grown past the cap. */
export function shouldTrimStartupLog(sizeBytes: number): boolean {
  return sizeBytes > STARTUP_LOG_MAX_BYTES
}

/**
 * What the child's exit means for a client that is waiting for a socket.
 *
 * Two outcomes that call for opposite behaviour, and the distinction is one
 * exit-code comparison across two halves of the CLI — `ENGINE_EXIT_ALREADY_RUNNING`
 * is raised in `engine/index.ts` and read here. Nothing tested it, so a
 * drift in that constant, or a `signal == null` that stopped holding,
 * silently restored the old failure: the client reported "exit 7 / Stop it
 * first" about an engine it had started itself.
 *
 * `'owned'` means someone else won `claimRunFile`, so an engine *is* coming
 * up and the poll should run to the deadline. Anything else is a startup
 * failure to report at once, with the log tail.
 */
export function classifyEngineExit(
  code: number | null,
  signal: NodeJS.Signals | null
): { kind: 'owned' } | { kind: 'died'; info: string } {
  if (signal == null && code === ENGINE_EXIT_ALREADY_RUNNING) {
    return { kind: 'owned' }
  }
  return {
    kind: 'died',
    info:
      signal != null ? `killed by ${signal}` : `exited with code ${code ?? 0}`
  }
}

/**
 * The seams `ensureEngine`'s three decisions are tested through.
 *
 * It closed over `spawn`, `pingEngine` and the two timings directly, so the
 * whole function was unreachable from a test — 4.3% of statements and 0% of
 * branches — and both fixes this branch put into it landed uncovered.
 * Injected the way the same branch injected `doFetch` into `fetchWaterfall`
 * and a request function into `httpsRequest`. Production passes nothing.
 */
export interface EnsureEngineDeps {
  spawn?: typeof spawn
  ping?: (socketPath: string) => Promise<boolean>
  spawnTimeoutMs?: number
  pollMs?: number
  /** The directory the candidates resolve against; `__dirname` in use. */
  entryDir?: string
}

/**
 * The child's environment, with the caller's credentials taken out.
 *
 * The engine is detached and long-lived, so `{ ...process.env }` handed it
 * every variable in `SECRET_FLAG_ENV` for its whole life: a
 * `EDGE_CLI_PASSWORD=… edge-cli login-with-password` exits in a second
 * while the daemon it spawned keeps that password in `/proc/<pid>/environ`
 * for hours — and for ever at `--idle-timeout=0` — and in any core dump.
 * The engine never needs them: the *client* resolves each secret and sends
 * it in the request body, which is why `EDGE_CLI_API_KEY` is the one
 * credential forwarded here, deliberately and explicitly.
 *
 * `EDGE_CLI_SESSION` goes too. It is a bearer token — holding one is full
 * account authority — and it is the client's own way of naming a session,
 * not something the engine reads.
 *
 * The whole point of those variables is to shorten a credential's exposure
 * window from "written in shell history" to "one process, one command", so
 * widening it to one daemon lifetime is the same defect on a different
 * surface.
 */
export function engineEnv(
  source: NodeJS.ProcessEnv = process.env
): NodeJS.ProcessEnv {
  // A deny-list: the whole environment is copied and the withheld names
  // are blanked, so a credential variable `secretFlags.ts` does not know
  // about *is* forwarded. What keeps the list honest is that it is derived
  // — `allSecretEnvNames()` — so a variable added there is withheld here
  // with no second edit. Blanked rather than deleted, because a dynamic
  // `delete` is what the lint rule forbids.
  const withheld = new Set<string>([...allSecretEnvNames(), 'EDGE_CLI_SESSION'])
  // Seeded from the source so the declared `NODE_ENV` survives the
  // rebuild, then overwritten key by key with what is kept.
  const out: NodeJS.ProcessEnv = { ...source }
  const scratch: Record<string, string | undefined> = out
  for (const name of Object.keys(source)) {
    if (withheld.has(name)) scratch[name] = undefined
  }
  return out
}

/**
 * Where the engine entry may be, given the directory this module runs from.
 *
 * Exported so a test can hold the list to its one rule: every candidate is
 * under `dir`, and none depends on the working directory.
 */
export function engineEntryCandidates(dir: string): string[] {
  return [
    path.resolve(dir, 'edgeEngine.js'),
    path.resolve(dir, '../engine/index.ts')
  ]
}

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
  const doSpawn = opts.deps?.spawn ?? spawn
  const ping = opts.deps?.ping ?? pingEngine
  const spawnTimeoutMs = opts.deps?.spawnTimeoutMs ?? SPAWN_TIMEOUT_MS
  const pollMs = opts.deps?.pollMs ?? 250

  if (await ping(socketPath)) return

  // Resolve the engine entry relative to this file, and nowhere else. The
  // sibling bundle comes first: rollup flattens src/cli into lib/edgeCli.js,
  // so in a built or installed tree (npm, Homebrew's libexec,
  // /usr/lib/edgecli) `__dirname` is the package's `lib/` and its sibling is
  // lib/edgeEngine.js. Running from source, `__dirname` is src/cli/client,
  // which has no edgeEngine.js, and `../engine/index.ts` is the source entry.
  //
  // Not the working directory. Two candidates resolved against it, which on
  // a partial install meant `edge-cli` run inside any checkout or download
  // spawned *that directory's* script as the detached daemon — handed
  // `EDGE_CLI_API_KEY` and, over the socket, every password and PIN typed
  // afterwards. A missing engine is a clean exit 7 instead.
  const candidates = engineEntryCandidates(opts.deps?.entryDir ?? __dirname)
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
  // `--no-spawn` hint prints cannot drift. They had: the hint omitted
  // `--tcp`, `-c` and `--locale`, so it told an operator to start an engine
  // without the config file they had just supplied. `-k` is not in here — it
  // crosses as `EDGE_CLI_API_KEY`, because `ps` shows an argv to every user
  // on the host — so the hint names the variable separately below.
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
    // The variable, never its value: this string goes to a terminal, a log
    // and whatever a supervisor captures. An operator who passed `-k` has
    // the key already; what they cannot know is that it does not travel on
    // the command line.
    const prefix =
      opts.apiKey != null && opts.apiKey !== ''
        ? 'EDGE_CLI_API_KEY=<your --api-key value> '
        : ''
    throw new EngineUnavailableError(
      `Engine is not running for profile ${profile} (socket ${socketPath}). Start it with: ${prefix}${runner}${
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
  // Both reported: the mode is what keeps another local user out of the
  // login stashes, and the engine starts either way — so a failure here has
  // to be visible or it is invisible.
  try {
    fs.mkdirSync(opts.directory, { recursive: true, mode: 0o700 })
  } catch (error: unknown) {
    // An existing directory is the ordinary case and not a failure.
    if ((error as NodeJS.ErrnoException)?.code !== 'EEXIST') {
      const message = errorMessage(error)
      console.error(`[edge-cli] could not create ${opts.directory}: ${message}`)
    }
  }
  try {
    fs.chmodSync(opts.directory, 0o700)
  } catch (error: unknown) {
    const message = errorMessage(error)
    console.error(
      `[edge-cli] could not set ${opts.directory} to 0700 (${message}); ` +
        'the login stashes in it may be readable by other local users'
    )
  }

  // Capture the child's output: a detached engine that dies during startup
  // (bad keys.json, plugin load failure) would otherwise fail silently and
  // surface only as a spawn timeout.
  const startupLog = path.join(ensureRunDir(profile), 'engine-startup.log')
  // 0600 like its siblings: it captures the engine's stdout/stderr, which
  // includes paths and, on a failure, whatever the engine was doing.
  //
  // Appended, not truncated. This fd is the engine's stdout and stderr for
  // its whole life, so `'w'` meant a second client's spawn attempt wiped
  // the log of an engine that was still booting — and both children then
  // wrote to one inode through independent fds at independent offsets, so
  // the surviving engine's startup record was the one record a racing
  // start could not be diagnosed from. Trimmed first when it has grown
  // past the cap, since nothing else bounds it between
  // `removeRunArtifacts` calls.
  try {
    if (shouldTrimStartupLog(fs.statSync(startupLog).size)) {
      fs.truncateSync(startupLog, 0)
    }
  } catch {
    // Not there yet, which is the ordinary first spawn.
  }
  const logFd = fs.openSync(startupLog, 'a', 0o600)
  const child = doSpawn(process.execPath, args, {
    detached: true,
    stdio: ['ignore', logFd, logFd],
    env: {
      ...engineEnv(process.env),
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
  // Someone else won `claimRunFile`, so an engine *is* coming up — just not
  // this child. Tracked apart from `exitInfo` because the two call for
  // opposite behaviour: keep polling to the spawn deadline rather than
  // reporting a startup failure.
  let anotherEngineOwnsIt = false
  child.once('error', (error: Error) => {
    spawnError = error
  })
  // An engine that dies during startup — a bad keys.json, a plugin that
  // throws, the "already running" exit — otherwise costs the caller the whole
  // spawn timeout before anyone looks at the log.
  child.once('exit', (code, signal) => {
    const verdict = classifyEngineExit(code, signal)
    if (verdict.kind === 'owned') {
      anotherEngineOwnsIt = true
      return
    }
    exitInfo = verdict.info
  })
  child.unref()
  fs.closeSync(logFd)

  const start = Date.now()
  while (Date.now() - start < spawnTimeoutMs) {
    await sleep(pollMs)
    if (spawnError != null) {
      throw new EngineUnavailableError(
        `Could not start the engine: ${spawnError.message} (${process.execPath})`
      )
    }
    if (exitInfo != null && !(await ping(socketPath))) {
      const earlyTail = readTail(startupLog, 2000)
      throw new EngineUnavailableError(
        `The engine ${exitInfo} during startup (profile ${profile}).` +
          (earlyTail === ''
            ? ` No engine output; see ${startupLog}.`
            : `\n--- engine output (${startupLog}) ---\n${earlyTail}`)
      )
    }
    if (await ping(socketPath)) return
  }

  const tail = readTail(startupLog, 2000)
  throw new EngineUnavailableError(
    `Timed out waiting for engine to start (profile ${profile})${
      exitInfo != null
        ? `; the process ${exitInfo}`
        : anotherEngineOwnsIt
        ? '; another engine owns the profile and never bound its socket'
        : ''
    }.` +
      (tail === ''
        ? ` No engine output; see ${startupLog}.`
        : `\n--- engine output (${startupLog}) ---\n${tail}`)
  )
}
