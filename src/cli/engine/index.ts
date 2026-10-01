/**
 * Edge CLI engine daemon entry point.
 *
 * Usage:
 *   node -r sucrase/register src/cli/engine/index.ts [options]
 *   edge-engine -t --tcp=<port>
 *
 * Run `edge-engine --help` for the options. `printHelp` below is the one
 * place they are written out as user-facing text: a copy here had already
 * drifted from it ("after idle" against "when idle"), and a reader has no way
 * to tell which of two lists is current.
 */

import '../bootEngineLocale'

import fs from 'fs'

import { clearRateCache, stopRateQueue } from '../../util/exchangeRates'
import { renderFlagHelp } from '../flagTable'
import { API_VERSION } from './apiVersion'
import { defaultDirectory, loadConfig } from './cliConfig'
import {
  claimRunFile,
  cleanupStaleLock,
  ensureRunDir,
  profileHash,
  readRunFile,
  removeRunArtifacts,
  runFilePath,
  socketPathFor,
  sweepStaleProfiles,
  writeRunFile
} from './discovery'
import { EventHub } from './events'
import { IdleShutdown } from './idleShutdown'
import { EngineLogger, sweepOldLogs } from './logger'
import { makeCoreContext } from './makeCoreContext'
import { ObjectHandleStore } from './objectHandles'
import { type EngineState, Router } from './router'
import { registerRoutes } from './routes'
import { createRequestHandler, listenTcp, listenUnix } from './server'
import { SessionStore } from './sessions'
import { makeSweepTicker } from './sweepTicker'
import { EXAMPLE_TCP_PORT, parseTcpPort } from './tcpPort'
import { TESTER_SERVERS } from './testerServers'
import {
  allowedHostnamesFor,
  makeTcpToken,
  type TcpGuard
} from './transportAuth'

interface EngineArgs {
  testMode: boolean
  fake: boolean
  directory?: string
  appId?: string
  apiKey?: string
  locale?: string
  tcpPort: number | null
  tcpHost: string
  idleTimeoutSeconds: number
  configPath?: string
  help: boolean
}

/** An inline `--flag=` value, refused when empty. */
function requireNonEmpty(value: string, flag: string): string {
  if (value === '') throw new EngineUsageError(`${flag} requires a value`)
  return value
}

/**
 * Refuse a TCP bind address that is not loopback.
 *
 * `--tcp` opens an authenticated port for local scripts, and every surface
 * that describes it — the help text, `docs/EDGE_CLI.md`, the comment on the
 * listener — says `127.0.0.1`. Binding elsewhere publishes
 * `get-raw-private-key`, `get-pin` and `spend` to whatever network the host
 * is on, which no token makes safe to offer by accident.
 */
function requireLoopback(host: string): string {
  const loopback =
    host === 'localhost' ||
    host === '::1' ||
    host === '[::1]' ||
    /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)
  if (!loopback) {
    throw new EngineUsageError(
      `--tcp-host must be a loopback address (127.0.0.0/8, ::1 or localhost), not "${host}": the TCP transport is for local scripts`
    )
  }
  return host
}

/**
 * The `--idle-timeout` value, validated once for both spellings.
 *
 * It was written out twice in the same function with error text that
 * disagreed, and neither copy refused an empty value: `Number('')` is `0`,
 * which is documented as "never", so `--idle-timeout=` produced an immortal
 * daemon holding an `EdgeContext` and a logged-in account open, silently.
 */
function parseIdleTimeout(raw: string | undefined): number {
  if (raw == null || raw === '') {
    throw new EngineUsageError(
      '--idle-timeout requires a value in seconds, where 0 means never'
    )
  }
  const seconds = Number(raw)
  if (!Number.isFinite(seconds) || seconds < 0) {
    throw new EngineUsageError(`Invalid --idle-timeout: ${raw}`)
  }
  return seconds
}

/**
 * The profile this process has claimed, once it has one.
 *
 * Module scope because `main().catch` runs outside `main`'s own scope and
 * still has to clean up what the claim created.
 */
let claimedProfile: string | null = null
/**
 * Whether this process ever bound the unix socket.
 *
 * A startup that claimed the profile and then died has to clear it, but the
 * socket and the user's `session.json` are only this process's to remove once
 * it has actually served on them. The case that matters is losing the
 * `listen` race: unlinking the winner's socket left it resident and
 * unreachable, holding an EdgeContext and a logged-in account open.
 */
let boundSocket = false

/**
 * How long a shutdown waits for requests that have already started.
 *
 * Long enough for a broadcast to finish saving, short enough that a wedged
 * request cannot keep the process alive. It is deliberately the same order
 * as the client's own socket timeout: a bound shorter than that let the
 * engine exit while the client was still waiting for an answer, which for a
 * `spend` means the money has left and the caller is told nothing.
 */
const SHUTDOWN_DRAIN_MS = 110_000

/** An env var that is set but blank is as good as unset. */
function emptyToUndefined(value: string | undefined): string | undefined {
  return value == null || value === '' ? undefined : value
}

/**
 * Create the core data directory `0700`, and tighten it if it is laxer.
 *
 * `<directory>/logins/*.json` carry `pin2Key`, `otpKey` and the password and
 * recovery boxes. Disklet's node backend writes them at the umask default,
 * so without this they were `0644` inside a `0755` directory and any other
 * local user could copy an account's stash and attack it offline. Every
 * other root this CLI owns is already `0700`.
 */
function ensureDataDir(directory: string): void {
  try {
    fs.mkdirSync(directory, { recursive: true, mode: 0o700 })
  } catch {
    // Already there, or unwritable — core will report the latter.
  }
  try {
    fs.chmodSync(directory, 0o700)
  } catch {
    // Not ours to tighten; core will fail if it cannot use it.
  }
}

/** Bad argv for the engine: reported cleanly, not as a crash. */
class EngineUsageError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EngineUsageError'
  }
}

/**
 * The value after a flag, refused when it is missing or is itself a flag.
 *
 * `argv[++i]` took whatever came next, so `--directory` at the end of the line
 * silently fell back to the default data directory, and
 * `--directory --tcp=9312` created a directory named `--tcp=9312` and dropped
 * the TCP flag.
 */
function flagValue(argv: string[], i: number, flag: string): string {
  const value = argv[i]
  if (value == null || value === '' || value.startsWith('-')) {
    throw new EngineUsageError(`${flag} requires a value`)
  }
  return value
}

function parseArgs(argv: string[]): EngineArgs {
  const args: EngineArgs = {
    testMode: false,
    fake: false,
    tcpPort: null,
    tcpHost: '127.0.0.1',
    idleTimeoutSeconds: 300,
    help: false
  }

  /**
   * The value of one valued flag, whichever spelling was used.
   *
   * Every valued flag used to be written twice — once for `--flag value`
   * through `flagValue`, once for `--flag=value` through `requireNonEmpty` —
   * so six flags took thirteen arms, and the two paths' error text had
   * already drifted. One arm each now, and `i` advances through the closure
   * because the space form consumes the next token.
   */
  let i = 0
  const valueOf = (long: string, short?: string): string | undefined => {
    const a = argv[i]
    if (a === long || (short != null && a === short)) {
      return flagValue(argv, ++i, a)
    }
    if (a.startsWith(`${long}=`)) {
      return requireNonEmpty(a.slice(long.length + 1), long)
    }
    return undefined
  }

  for (i = 0; i < argv.length; i++) {
    const a = argv[i]
    const directory = valueOf('--directory', '-d')
    const appId = valueOf('--app-id', '-a')
    const apiKey = valueOf('--api-key', '-k')
    const locale = valueOf('--locale')
    const configPath = valueOf('--config', '-c')
    if (directory != null) {
      args.directory = directory
    } else if (appId != null) {
      args.appId = appId
    } else if (apiKey != null) {
      args.apiKey = apiKey
    } else if (locale != null) {
      args.locale = locale
    } else if (configPath != null) {
      args.configPath = configPath
    } else if (a === '-h' || a === '--help') {
      args.help = true
    } else if (a === '-t' || a === '--test') {
      args.testMode = true
    } else if (a === '--fake') {
      args.fake = true
    } else if (a === '--tcp') {
      throw new EngineUsageError(
        `--tcp requires a port, e.g. --tcp=${EXAMPLE_TCP_PORT}`
      )
    } else if (a.startsWith('--tcp=')) {
      // The same validator the client uses, so one spelling cannot be
      // accepted here and refused there.
      try {
        args.tcpPort = parseTcpPort(a.slice('--tcp='.length))
      } catch (error: unknown) {
        throw new EngineUsageError(
          error instanceof Error ? error.message : String(error)
        )
      }
    } else if (a.startsWith('--tcp-host=')) {
      // Node's `server.listen(port, '')` takes the falsy-host branch and
      // binds the unspecified address, so `--tcp-host=` used to publish the
      // engine on every interface. An explicit non-loopback address did the
      // same thing and was the bigger hole: the help text, the guide and this
      // code's own intent all say loopback, and an engine reachable from the
      // LAN exposes `get-raw-private-key` and `spend` to it.
      args.tcpHost = requireLoopback(
        requireNonEmpty(a.slice('--tcp-host='.length), '--tcp-host')
      )
    } else if (a.startsWith('--idle-timeout=')) {
      args.idleTimeoutSeconds = parseIdleTimeout(
        a.slice('--idle-timeout='.length)
      )
    } else if (a === '--idle-timeout') {
      args.idleTimeoutSeconds = parseIdleTimeout(argv[++i])
    } else {
      throw new EngineUsageError(`Unknown argument: ${a}`)
    }
  }
  return args
}

function printHelp(): void {
  console.log(`Usage: edge-engine [options]

Options:
${renderFlagHelp('engine')}
`)
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    printHelp()
    process.exit(0)
  }

  const fileConfig = loadConfig(args.configPath)
  const appId = args.appId ?? fileConfig.appId ?? ''
  const directory =
    args.directory ??
    fileConfig.directory ??
    fileConfig.workingDir ??
    defaultDirectory()
  const testMode = args.testMode || fileConfig.testMode === true
  // Two distinct things, deliberately. An *explicit* key — `-k`, or
  // `EDGE_CLI_API_KEY` which is how the client forwards one without putting
  // a credential on a command line `ps` shows to every user — is an
  // operator override: `makeCoreContext` drops the keys.json secret and
  // skips the native HMAC signer for it, which is what the guide documents.
  // A key that merely sits in the config file is not an override, and
  // conflating them turned off request signing for anyone who put `apiKey`
  // in `edge-cli.conf`.
  const explicitApiKey =
    args.apiKey ?? emptyToUndefined(process.env.EDGE_CLI_API_KEY)
  const configApiKey = fileConfig.apiKey

  const events = new EventHub()
  const sessions = new SessionStore(events)
  const objects = new ObjectHandleStore()
  // Peers: a logout releases the handles that session owned, so they cannot
  // outlive the account they belong to.
  sessions.objects = objects

  // The fake world is its own profile, so a fake engine never answers on the
  // socket a real one is using, or vice versa.
  const profile = profileHash({
    appId,
    directory,
    testMode,
    loginServer: args.fake
      ? 'fake://login'
      : testMode
      ? TESTER_SERVERS.loginServer
      : undefined
  })
  const logger = new EngineLogger(profile)
  logger.info('Engine starting', {
    pid: process.pid,
    appId,
    directory,
    testMode,
    locale: args.locale
  })

  // Claim the profile before touching the data directory. `makeCoreContext`
  // opens the on-disk repos and starts every plugin, so doing it first let two
  // cold `edge-cli` invocations hold two EdgeContexts on one directory for
  // seconds before either noticed the other — and, because the run file was
  // not written until the listeners were up, the second engine's
  // `cleanupStaleLock` would unlink the first engine's live socket.
  ensureRunDir(profile)
  // Housekeeping, before this engine adds to either pile. Both are bounded
  // only by how many throwaway profiles a machine has ever used: 428 run
  // directories and 612 log files had accumulated on one development
  // machine, and 235 of those directories still held a session.json.
  const staleProfiles = sweepStaleProfiles(profile)
  // `logger.logPath` is this process's own file, which `unlinkSync` would
  // happily remove on POSIX while the stream kept writing to the inode.
  const staleLogs = sweepOldLogs(undefined, logger.logPath)
  // From here on this process owns the profile directory, so a fatal startup
  // has to clear it rather than leave a socket and run file that make the
  // profile look live to the next client.
  claimedProfile = profile
  const livePid = await cleanupStaleLock(profile)
  const socketPath = socketPathFor(profile)
  const claimed =
    livePid == null &&
    claimRunFile(profile, {
      pid: process.pid,
      apiVersion: API_VERSION,
      socketPath,
      // Both filled in by the `writeRunFile` below, once the listeners are
      // up and the core's effective `testMode` is known.
      tcpPort: null,
      tcpToken: undefined,
      appId,
      testMode,
      startedAt: new Date().toISOString()
    })
  if (!claimed) {
    const owner = livePid ?? readRunFile(profile)?.pid
    console.error(
      `[edge-engine] An engine is already running for profile ${profile}` +
        (owner != null ? ` (pid ${owner})` : '') +
        `.\nStop it first (edge-cli engine-stop) or use a different --directory/--app-id.`
    )
    process.exit(1)
  }

  // The core data directory holds the login stashes, so the engine creates
  // it `0700` itself rather than leaving it to whoever spawned it: `npm run
  // engine` and `node lib/edgeEngine.js` reach this with no client involved,
  // and core's disklet then creates it at the umask default.
  ensureDataDir(directory)

  const core = await makeCoreContext({
    apiKey: explicitApiKey,
    configApiKey,
    appId,
    directory,
    testMode,
    fake: args.fake,
    events,
    logger
  })

  let shuttingDown = false
  let unixServer: Awaited<ReturnType<typeof listenUnix>> | null = null
  let tcpServer: Awaited<ReturnType<typeof listenTcp>>['server'] | null = null
  let boundTcpPort: number | null = null
  let tcpToken: string | null = null

  /** Wait for in-flight requests to finish, up to SHUTDOWN_DRAIN_MS. */
  const drainRequests = async (): Promise<void> => {
    const deadline = Date.now() + SHUTDOWN_DRAIN_MS
    while (idle.requestsInFlight > 0 && Date.now() < deadline) {
      await new Promise<void>(resolve => setTimeout(resolve, 25))
    }
    const stuck = idle.requestsInFlight
    if (stuck > 0) {
      logger.warn(
        `Shutting down with ${stuck} request(s) still in flight after ${SHUTDOWN_DRAIN_MS}ms`
      )
    }
  }

  /**
   * The SSE keepalive ticker, which only exists once the routes are up.
   *
   * A `let` rather than the `const` further down, because `shutdown` closes
   * over it and ran 154 lines earlier in the temporal dead zone: a teardown
   * during the startup tail threw `Cannot access 'ssePing' before
   * initialization`, and since `shutdown` sets `state.shuttingDown` as its
   * second statement the daemon was left answering 503 for ever. The window
   * is real — `--tcp-host=localhost` is not an IP literal, so binding does a
   * `dns.lookup`, which yields to the event loop.
   */
  let ssePing: ReturnType<typeof makeSweepTicker> | null = null

  /**
   * Report a teardown that failed, and still let go of the profile.
   *
   * `shutdown()` sets `state.shuttingDown` as its second statement, so a
   * rejection after that point left the engine permanently wedged: it never
   * reached `process.exit(0)`, every later request answered
   * `503 ENGINE_SHUTTING_DOWN`, a second `engine-stop` returned early, and
   * the socket and run file stayed in place. Both callers discarded the
   * error, so nothing was written to the log either — the operator saw
   * Ctrl-C do nothing and had to `kill -9` and clear the run directory by
   * hand.
   */
  const onShutdownFailure = (error: unknown): void => {
    const message = error instanceof Error ? error.message : String(error)
    try {
      logger.error('Shutdown failed', { message })
    } catch {
      // The logger may be what failed.
    }
    console.error(`[edge-engine] shutdown failed: ${message}`)
    removeRunArtifacts(profile, {
      keepSocket: !boundSocket,
      keepSession: !boundSocket
    })
    process.exit(1)
  }
  /**
   * Stop the engine, saying why.
   *
   * The reason reaches two places that need it: the `engine.shutdown` event,
   * which a subscriber reads, and the exit status. All three outcomes —
   * `engine-stop`, the idle timeout and a crash — used to emit
   * `reason: 'requested'` and exit 0, so a supervisor could not tell them
   * apart and `spawnEngine`'s startup diagnostic told an operator "the
   * engine exited with code 0 during startup" for an engine that had thrown
   * while loading a bad `keys.json` or a plugin.
   */
  const shutdown = async (
    reason: 'requested' | 'idle' | 'fatal' = 'requested'
  ): Promise<void> => {
    if (shuttingDown) return
    shuttingDown = true
    state.shuttingDown = true
    events.emit('engine.shutdown', { reason })
    idle.stop()
    // `state.shuttingDown` already answers new requests with
    // `503 ENGINE_SHUTTING_DOWN`, but a request that has already started
    // keeps its account: tearing the core down mid-`spend` could land between
    // `broadcastTx` and `saveTx`, so the money leaves the wallet, the client
    // gets no response at all, and local history does not have the
    // transaction until a sync finds it. The idle path already refuses to
    // fire while anything is in flight; `engine-stop` and SIGINT now wait the
    // same way, with a bound so a wedged request cannot block the exit.
    await drainRequests()
    sessions.stopAutoLogoutTicker()
    objects.stopTicker()
    ssePing?.stop()
    await objects.clearAll()
    await sessions.logoutAll()
    // Both: the cache is state, and the queue is work. A debounce armed just
    // before shutdown would otherwise fire against a closing context, and
    // anything still awaiting a rate would never settle.
    stopRateQueue()
    clearRateCache()
    try {
      await core.context.close()
    } catch {
      // ignore
    }
    // Let subscribers learn why the stream ended before the socket closes.
    events.closeAll('engineShutdown')
    logger.info('Engine shutdown complete')
    await logger.close()
    await new Promise<void>(resolve => {
      if (unixServer == null) {
        resolve()
        return
      }
      unixServer.close(() => {
        resolve()
      })
    })
    await new Promise<void>(resolve => {
      if (tcpServer == null) {
        resolve()
        return
      }
      tcpServer.close(() => {
        resolve()
      })
    })
    removeRunArtifacts(profile)
    // Non-zero for a crash, so a supervisor restarts it and the client's own
    // diagnostic says something useful. `main().catch` already gets this
    // right; it is the post-startup path that lost it.
    process.exit(reason === 'fatal' ? 1 : 0)
  }

  const idle = new IdleShutdown({
    idleTimeoutSeconds: args.idleTimeoutSeconds,
    getSessionCount: () => sessions.size,
    getSubscriberCount: () => events.clientCount,
    getSessionlessHandleCount: () => objects.sessionlessCount,
    onFire: async () => {
      logger.warn('Idle timeout — shutting down')
      await shutdown('idle')
    }
  })
  sessions.onSessionsChanged = () => {
    idle.notifySessionsChanged()
  }
  events.onClientsChanged = () => {
    idle.notifySubscribersChanged()
  }
  objects.onHandlesChanged = () => {
    idle.notifyHandlesChanged()
  }

  const state: EngineState = {
    core,
    sessions,
    objects,
    events,
    idle,
    // The real handler, not a placeholder replaced further down: a teardown
    // that threw during the startup tail landed in the no-op that used to sit
    // here, so the rejection was discarded and the engine stayed wedged with
    // `state.shuttingDown` already true.
    onShutdownFailure,
    logger,
    profile,
    socketPath,
    tcpPort: null,
    startedAt: Date.now(),
    shuttingDown: false,
    shutdown
  }

  const router = new Router()
  registerRoutes(router)

  unixServer = await listenUnix(createRequestHandler(state, router), socketPath)
  boundSocket = true
  console.error(`[edge-engine] Listening on unix:${socketPath}`)

  if (args.tcpPort != null) {
    // Opt-in loopback TCP for local scripts, authenticated. The unix socket
    // can rely on its `0600` mode; a TCP port cannot, and a `sessionId` is
    // full account authority, so `transportAuth.ts` requires a bearer token
    // from the `0600` run file, refuses a foreign `Host` and refuses any
    // request carrying `Origin`.
    tcpToken = makeTcpToken()
    const guard: TcpGuard = {
      token: tcpToken,
      allowedHostnames: allowedHostnamesFor(args.tcpHost)
    }
    const tcp = await listenTcp(
      createRequestHandler(state, router, guard),
      args.tcpPort,
      args.tcpHost
    )
    tcpServer = tcp.server
    boundTcpPort = tcp.port
    state.tcpPort = boundTcpPort
    console.error(
      `[edge-engine] Listening on http://${
        args.tcpHost
      }:${boundTcpPort} (token in ${runFilePath(profile)})`
    )
  }

  writeRunFile(profile, {
    pid: process.pid,
    apiVersion: API_VERSION,
    socketPath,
    tcpPort: boundTcpPort,
    // Only set when the TCP listener is on, and only readable by this user:
    // the run file is `0600` inside a `0700` directory, which is what makes
    // being able to read it the authorisation to call.
    tcpToken: tcpToken ?? undefined,
    appId,
    // The core's effective value, not the argv-derived one, so the run file
    // agrees with what `engine-status` and `engine-config` report. `--fake`
    // reports true: the fake world is not production, which is what a caller
    // checking this field wants to know.
    testMode: core.testMode,
    startedAt: new Date().toISOString()
  })

  sessions.startAutoLogoutTicker()
  objects.startTicker()
  // A comment frame on every sweep, so a subscriber that vanished without a
  // clean FIN — a sleeping laptop, a killed container, a dropped TCP link —
  // is reaped rather than holding the engine open for good.
  ssePing = makeSweepTicker('sse keepalive', async () => {
    events.pingClients()
  })
  ssePing.start()

  const onSignal = (): void => {
    shutdown().catch(onShutdownFailure)
  }
  process.on('SIGINT', onSignal)
  process.on('SIGTERM', onSignal)

  // A daemon that dies without running `shutdown()` leaves its socket and run
  // file behind, so the next client finds a profile that looks live and waits
  // out its connect timeout. `main().catch` cannot cover this: an uncaught
  // exception or an unhandled rejection after startup never becomes a
  // rejection of `main`.
  const onFatal = (what: string) => (error: unknown) => {
    const message =
      error instanceof Error ? error.stack ?? error.message : String(error)
    console.error(`[edge-engine] ${what}: ${message}`)
    try {
      logger.error(what, { error: message })
    } catch {
      // The logger itself may be what failed.
    }
    shutdown('fatal').catch(onShutdownFailure)
  }
  process.on('uncaughtException', onFatal('uncaught exception'))
  process.on('unhandledRejection', onFatal('unhandled rejection'))

  console.error(
    `[edge-engine] Ready (pid=${process.pid}, profile=${profile}, testMode=${testMode}, log=${logger.logPath})`
  )
  logger.info('Ready', { pid: process.pid, profile, testMode })
  if (staleProfiles > 0 || staleLogs > 0) {
    logger.info('Swept abandoned engine state', { staleProfiles, staleLogs })
  }
}

main().catch((error: unknown) => {
  // Bad argv is the operator's mistake, not a crash: one line and exit 2,
  // matching the client's documented exit model. Anything else keeps its
  // stack, because that is a fault worth reading.
  if (error instanceof EngineUsageError) {
    console.error(`[edge-engine] ${error.message}`)
    process.exit(2)
  }
  console.error('[edge-engine] Fatal:', error)
  // A startup that dies after claiming the profile — a port already in use, a
  // plugin that throws — used to leave its socket, run file and any
  // session.json behind, so the next client found a profile that looked live
  // and waited out its connect timeout. The startup log is kept: it is the
  // only record of what happened.
  if (claimedProfile != null) {
    removeRunArtifacts(claimedProfile, {
      keepStartupLog: true,
      keepSocket: !boundSocket,
      keepSession: !boundSocket
    })
  }
  process.exit(1)
})
