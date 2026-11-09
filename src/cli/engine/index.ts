/**
 * Edge CLI engine daemon entry point.
 *
 * Usage:
 *   node -r sucrase/register src/cli/engine/index.ts [options]
 *   edge-engine -t --tcp=<port>
 *
 * Run `edge-engine --help` for the options. `src/cli/flagTable.ts` is the one
 * place they are written out as user-facing text — `printHelp` below renders
 * that table, and `scripts/verifyApiDocs.ts` gates it against the guide. A
 * copy here would drift from it, and a reader would have no way to tell
 * which of two lists is current.
 */

import '../bootEngineLocale'

import { inspect } from 'util'

import {
  clearRateCache,
  configureExchangeRates,
  stopRateQueue
} from '../../util/exchangeRates'
import { raceTimeout, TIMED_OUT, unrefTimer } from '../../util/raceTimeout'
import { configureWarningSink } from '../../util/reportWarning'
import { withDeadline } from '../../util/withDeadline'
import { emptyToUndefined } from '../envValue'
import { renderFlagHelp } from '../flagTable'
import { API_VERSION } from './apiVersion'
import { defaultDirectory, loadConfigFrom } from './cliConfig'
import { secureDataDir } from './dataDir'
import {
  claimRunFile,
  cleanupStaleLock,
  ENGINE_EXIT_ALREADY_RUNNING,
  ensureRunDir,
  newSocketPath,
  profileHash,
  readRunFile,
  removeRunArtifacts,
  runFilePath,
  sweepStaleProfiles,
  writeRunFile
} from './discovery'
import { EngineUsageError, parseEngineArgs } from './engineArgs'
import { errorMessage } from './errors'
import { EventHub } from './events'
import { FAKE_SERVERS } from './fakeServers'
import { IdleShutdown } from './idleShutdown'
import { EngineLogger, type EngineReporter, sweepOldLogs } from './logger'
import { makeCoreContext } from './makeCoreContext'
import { ObjectHandleStore } from './objectHandles'
import { type EngineState, Router } from './router'
import { registerRoutes } from './routes'
import { createRequestHandler, listenTcp, listenUnix } from './server'
import { SessionStore } from './sessions'
import {
  CORE_TEARDOWN_WAIT_MS,
  drainToFloor,
  LISTENER_CLOSE_WAIT_MS,
  SHUTDOWN_DRAIN_MS
} from './shutdownTiming'
import { makeSweepTicker } from './sweepTicker'
import { TESTER_SERVERS } from './testerServers'
import {
  allowedHostnamesFor,
  makeTcpToken,
  type TcpGuard
} from './transportAuth'

/**
 * The profile this process has claimed, once it has one.
 *
 * Module scope because `main().catch` runs outside `main`'s own scope and
 * still has to clean up what the claim created.
 */
let claimedProfile: string | null = null
/** This process's claim, so its cleanup never removes another engine's. */
let ownClaim: { pid: number; startedAt: string } | undefined
/**
 * Whether this process ever bound the unix socket.
 *
 * A startup that claimed the profile and then died has to clear it, but the
 * socket and the user's `session.json` are only this process's to remove once
 * it has actually served on them. The case that matters is losing the
 * `listen` race: unlinking the winner's socket would leave it resident and
 * unreachable, holding an EdgeContext and a logged-in account open.
 */
let boundSocket = false

function printHelp(): void {
  console.log(`Usage: edge-engine [options]

Options:
${renderFlagHelp('engine')}
`)
}

async function main(): Promise<void> {
  const args = parseEngineArgs(process.argv.slice(2))
  if (args.help) {
    printHelp()
    process.exit(0)
  }

  const { config: fileConfig, path: cliConfigPath } = loadConfigFrom(
    args.configPath
  )
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
  // conflating them would turn off request signing for anyone who put
  // `apiKey` in `edge-cli.conf`.
  const explicitApiKey =
    args.apiKey ?? emptyToUndefined(process.env.EDGE_CLI_API_KEY)
  const configApiKey = fileConfig.apiKey

  // The fake world is its own profile, so a fake engine never answers on the
  // socket a real one is using, or vice versa.
  const profile = profileHash({
    appId,
    directory,
    testMode,
    loginServer: args.fake
      ? FAKE_SERVERS.loginServer
      : testMode
      ? TESTER_SERVERS.loginServer
      : undefined
  })
  const logger = new EngineLogger(profile)
  /**
   * Both sinks, for everything in this engine that reports a failure.
   *
   * The file, because `console` is not a record: the daemon is started
   * detached with `stdio: ['ignore', logFd, logFd]` pointed at
   * `engine-startup.log`, which every ordinary stop retires, so the failure
   * a handle, a logout, a sweep or a listener reports is kept in
   * `engine-<profile>.log`. `console` as well, because a developer running
   * `npm run engine` in the foreground is reading stderr, not the log.
   *
   * One object, passed to every module that reports: `EventHub`,
   * `SessionStore`, `IdleShutdown`, the sweep tickers, both listeners and
   * `ObjectHandleStore`.
   */
  const report: EngineReporter = {
    warn: (message, extra) => {
      console.warn(`[edge-engine] ${message}`)
      logger.warn(message, extra)
    },
    error: (message, extra) => {
      console.error(`[edge-engine] ${message}`)
      logger.error(message, extra)
    }
  }
  // And the shared GUI/CLI modules, which are free functions rather than
  // classes and so report through a module-level sink instead of a
  // constructor: `fillTxsFiat`, `localAccountSettings`, the display
  // derivations and the rates queue. Their warnings are the only diagnostic
  // for failures such as a rates server that 500s, which makes every CSV,
  // QBO and Bitwave file carry no fiat value.
  configureWarningSink(message => {
    report.warn(message)
  })
  // `configureExchangeRates` is the hook that module publishes for this;
  // the GUI points it at an Airship toast from `exchangeRatesGui.ts`.
  configureExchangeRates({
    // Both at `warn`: one pass of a retried background queue and the chain
    // giving up are both "the export may carry no fiat value", which is a
    // diagnostic rather than a failure of the request in hand — the route
    // refuses on `unavailable` separately, with a code.
    onError: error => {
      report.warn(`rate query chain failed: ${errorMessage(error)}`)
    },
    onPassError: error => {
      report.warn(`rate query failed: ${errorMessage(error)}`)
    }
  })
  // After the logger, all three, because what they report is the engine's
  // history: a handle whose teardown fails — `quote.close()` is the only
  // cancellation of a real order at a swap partner — an account that would
  // not log out, an event that would not serialise.
  const events = new EventHub(report)
  const sessions = new SessionStore(events, report)
  const objects = new ObjectHandleStore(report)
  // Peers: a logout releases the handles that session owned, so they cannot
  // outlive the account they belong to.
  sessions.objects = objects
  logger.info('Engine starting', {
    pid: process.pid,
    appId,
    directory,
    testMode,
    locale: args.locale
  })

  // Claim the profile before touching the data directory. `makeCoreContext`
  // opens the on-disk repos and starts every plugin, so doing it first would
  // let two cold `edge-cli` invocations hold two EdgeContexts on one
  // directory for seconds before either noticed the other, and with no run
  // file until the listeners were up, the second engine's `cleanupStaleLock`
  // would unlink the first engine's live socket.
  ensureRunDir(profile)
  // Housekeeping, before this engine adds to either pile. Without it both
  // are bounded only by how many throwaway profiles a machine has ever used.
  const staleProfiles = await sweepStaleProfiles(profile)
  // `logger.logPath` is this process's own file, which `unlinkSync` would
  // happily remove on POSIX while the stream kept writing to the inode.
  const staleLogs = sweepOldLogs(undefined, logger.logPath)
  const livePid = await cleanupStaleLock(profile)
  const socketPath = newSocketPath(profile)
  // One timestamp for the claim and for the post-bind rewrite below, so the
  // claim keeps its identity: `discovery.ts`'s `claimUnchanged` compares
  // `pid` and `startedAt`, and a fresh `startedAt` at bind would make a sweep
  // that straddles the rewrite read the same engine as a different claim.
  const claimedAt = new Date().toISOString()
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
      startedAt: claimedAt
    })
  // After the claim, not before it. `main().catch` clears `claimedProfile`'s
  // artifacts, and a claim that failed for anything other than EEXIST
  // (ENOSPC, EDQUOT, a root-owned `engine.json` from an earlier `sudo` run)
  // leaves nothing that is this process's to clear. Deleting the *other*,
  // still-running engine's run file would leave that engine serving while
  // the next startup reads no claim, falls past the boot grace and unlinks
  // its live socket, leaving it resident and unreachable — the wedge
  // `cleanupStaleLock` exists to prevent. EEXIST exits rather than throwing,
  // so it never reaches `main().catch`.
  if (claimed) {
    claimedProfile = profile
    ownClaim = { pid: process.pid, startedAt: claimedAt }
  }
  if (!claimed) {
    const owner = livePid ?? readRunFile(profile)?.pid
    console.error(
      `[edge-engine] An engine is already running for profile ${profile}` +
        (owner != null ? ` (pid ${owner})` : '') +
        `.\nStop it first (edge-cli engine-stop) or use a different --directory/--app-id.`
    )
    // Its own code, not `1`: a client that spawned this engine has to tell
    // "someone else owns the profile, so keep waiting for them" from "this
    // engine failed to start".
    process.exit(ENGINE_EXIT_ALREADY_RUNNING)
  }

  // The core data directory holds the login stashes, so the engine creates
  // it `0700` itself rather than leaving it to whoever spawned it: `npm run
  // engine` and `node lib/edgeEngine.js` reach this with no client involved,
  // and core's disklet then creates it at the umask default.
  const dataDirWarning = secureDataDir(directory)
  if (dataDirWarning != null) console.error(`[edge-engine] ${dataDirWarning}`)

  const core = await makeCoreContext({
    apiKey: explicitApiKey,
    configApiKey,
    cliConfigPath,
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
    await drainToFloor({
      inFlight: () => idle.requestsInFlight,
      floor: 0,
      budgetMs: SHUTDOWN_DRAIN_MS,
      describe: stuck =>
        `Shutting down with ${stuck} request(s) still in flight after ${SHUTDOWN_DRAIN_MS}ms`,
      warn: message => {
        logger.warn(message)
      }
    })
  }

  /**
   * The SSE keepalive ticker, which only exists once the routes are up.
   *
   * A `let` declared here rather than a `const` where it is assigned,
   * because `shutdown` closes over it and can run before that line: a
   * teardown during the startup tail would hit the temporal dead zone and
   * throw `Cannot access 'ssePing' before initialization`, and since
   * `shutdown` sets `state.shuttingDown` at its start the daemon would be
   * left answering 503 for ever. The window is real — `--tcp-host=localhost`
   * is not an IP literal, so binding does a `dns.lookup`, which yields to
   * the event loop.
   */
  let ssePing: ReturnType<typeof makeSweepTicker> | null = null

  /**
   * Report a teardown that failed, and still let go of the profile.
   *
   * `shutdown()` sets `state.shuttingDown` at its start, so a rejection
   * after that point would leave the engine permanently wedged: it would
   * never reach `process.exit(0)`, every later request would answer
   * `503 ENGINE_SHUTTING_DOWN`, a second `engine-stop` would return early,
   * and the socket and run file would stay in place until an operator ran
   * `kill -9` and cleared the run directory by hand.
   */
  const onShutdownFailure = (error: unknown): void => {
    const message = errorMessage(error)
    try {
      logger.error('Shutdown failed', { message })
    } catch {
      // The logger may be what failed.
    }
    console.error(`[edge-engine] shutdown failed: ${message}`)
    removeRunArtifacts(profile, {
      claim: ownClaim,
      keepSocket: !boundSocket,
      keepSession: !boundSocket,
      // A shutdown that itself failed is the case most worth reading about,
      // and this message only exists in the startup log.
      keepStartupLog: true
    })
    process.exit(1)
  }
  /**
   * Close one listener, bounded, and say so when it will not close.
   *
   * `server.close()` calls back only once *every* open connection has ended,
   * and nothing else here ends them: a request still in flight after the
   * 110-second drain — a `spend` on a congested chain, a `resync-blockchain`
   * — or a `subscribe` client on a sleeping laptop whose FIN cannot be
   * delivered would leave an unbounded close awaiting for ever.
   * `removeRunArtifacts` and `process.exit` would never run, so the socket,
   * the run file and the profile would stay in place and every later
   * invocation would answer "An engine is already running … Stop it first",
   * recoverable only with `kill -9` — the exact sequence `shutdownTiming.ts`
   * exists to prevent.
   *
   * `closeAllConnections()` after the grace window, because a connection the
   * client cannot close is not a reason to keep the daemon alive; the handler
   * has already drained, logged out and closed the context by this point.
   */
  async function closeListener(
    server: Awaited<ReturnType<typeof listenUnix>> | null,
    what: string
  ): Promise<void> {
    if (server == null) return
    const closed = new Promise<void>(resolve => {
      server.close(() => {
        resolve()
      })
    })
    const result = await raceTimeout(closed, LISTENER_CLOSE_WAIT_MS)
    if (result !== TIMED_OUT) return
    report.warn(
      `${what} still had open connections after ` +
        `${LISTENER_CLOSE_WAIT_MS}ms; closing them`
    )
    server.closeAllConnections()
    const forced = await raceTimeout(closed, LISTENER_CLOSE_WAIT_MS)
    if (forced === TIMED_OUT) {
      report.error(
        `${what} did not close; exiting anyway so the profile is released`
      )
    }
  }

  /**
   * Stop the engine, saying why.
   *
   * The reason reaches two places that need it: the `engine.shutdown` event,
   * which a subscriber reads, and the exit status, which is non-zero for a
   * crash. Between them a supervisor can tell `engine-stop`, the idle
   * timeout and a crash apart.
   */
  const shutdownInner = async (
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
    // transaction until a sync finds it. The idle path refuses to fire while
    // anything is in flight, and `engine-stop` and SIGINT wait for it here,
    // with a bound so a wedged request cannot block the exit.
    await drainRequests()
    sessions.stopAutoLogoutTicker()
    objects.stopTicker()
    ssePing?.stop()
    await objects.clearAll()
    await sessions.logoutAll()
    // Both: the cache is state, and the queue is work. A debounce armed just
    // before shutdown would otherwise fire against a closing context, and
    // anything still awaiting a rate would never settle. Independent, in
    // either order: `clearRateCache` leaves the stop latch alone.
    stopRateQueue()
    clearRateCache()
    try {
      // Bounded, like the per-session logout above it: a `close()` that never
      // settles is an engine that never exits, holding the socket and the run
      // file against every later invocation.
      await withDeadline(
        core.context.close(),
        CORE_TEARDOWN_WAIT_MS,
        'closing the core context did not finish'
      )
    } catch (error: unknown) {
      // Reported, and the shutdown carries on deliberately: there is nothing
      // left to retry with, and the process is going away either way. But
      // `context.close()` is where core tears down every wallet engine and
      // flushes what it still holds, so a rejection here says the data
      // directory may not be consistent — and the lines below still log
      // "Engine shutdown complete" and, short of a crash, exit 0.
      const message = errorMessage(error)
      logger.error('Core context close failed', { message })
    }
    // Let subscribers learn why the stream ended before the socket closes.
    events.closeAll('engineShutdown')
    // The listeners before the logger closes, so a close that does not finish
    // is written down rather than lost: `closeListener` reports and carries
    // on, which it can only do while the logger is open.
    await closeListener(unixServer, 'unix socket')
    await closeListener(tcpServer, 'tcp')
    logger.info('Engine shutdown complete')
    await logger.close()
    // The startup log survives a crash. Everything the engine reports with
    // `console` goes *only* there — `spawnEngine` starts the daemon detached
    // with `stdio: ['ignore', logFd, logFd]` — so deleting it on the way out
    // would make a fatal shutdown remove its own diagnostics. A clean stop
    // still takes it, so the "leave no empty profile directory" rule holds
    // for the ordinary case; a crash leaves the one file that says why.
    // Only while the run file is still this engine's: a replacement may
    // have claimed the profile while the listeners drained.
    removeRunArtifacts(profile, {
      claim: ownClaim,
      keepStartupLog: reason === 'fatal'
    })
    // Non-zero for a crash, so a supervisor restarts it and the client's own
    // diagnostic says something useful, as `main().catch` does for a failed
    // startup.
    process.exit(reason === 'fatal' ? 1 : 0)
  }

  /**
   * The one door, with the failure sink built in.
   *
   * Every trigger goes through here, the idle timer included: it runs
   * unattended, on every engine, by default, and `IdleShutdown` on its own
   * only clears `shuttingDown`, re-arms and logs one
   * `idle shutdown failed:` line. `shutdownInner` sets `state.shuttingDown`
   * at its start and every phase after that swallows its own failure, so
   * what is left to reject — `logger.close()` on a full disk,
   * `removeRunArtifacts` against a root-owned file from an earlier `sudo`
   * run — would otherwise wedge the engine for good: `process.exit` would
   * never run, the socket and run file would stay, every request would
   * answer 503, and `engine-stop` would return `{ok: true}` doing nothing.
   * That is the exact state `onShutdownFailure` exists to end.
   *
   * Routing it here rather than at each call site makes it structural: a
   * trigger added later cannot forget.
   */
  const shutdown = async (
    reason: 'requested' | 'idle' | 'fatal' = 'requested'
  ): Promise<void> => {
    try {
      await shutdownInner(reason)
    } catch (error: unknown) {
      onShutdownFailure(error)
    }
  }

  const idle = new IdleShutdown({
    report,
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
    // that throws during the startup tail lands here, and a no-op would
    // discard the rejection and leave the engine wedged with
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

  unixServer = await listenUnix(
    createRequestHandler(state, router),
    socketPath,
    report
  )
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
      args.tcpHost,
      report
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
    startedAt: claimedAt
  })

  sessions.startAutoLogoutTicker()
  objects.startTicker()
  // A comment frame on every sweep, so a subscriber that vanished without a
  // clean FIN — a sleeping laptop, a killed container, a dropped TCP link —
  // is reaped rather than holding the engine open for good.
  ssePing = makeSweepTicker(
    'sse keepalive',
    async () => {
      events.pingClients()
    },
    report
  )
  ssePing.start()

  const onSignal = (): void => {
    // `shutdown` owns its failure sink, so every trigger gets
    // `onShutdownFailure` whether or not it remembers to ask. The empty
    // catch is `no-void`'s price for a fire-and-forget.
    shutdown().catch(() => {})
  }
  process.on('SIGINT', onSignal)
  process.on('SIGTERM', onSignal)

  /**
   * What a thrown or rejected value says, when it is not an `Error`.
   *
   * `String(error)` on a plain object is `[object Object]`, and a plugin
   * rejecting with its own object is the one failure class that actually
   * happens here, so with `String` both `engine-startup.log` and
   * `engine-<profile>.log` would carry `[object Object]`, with no plugin
   * name, no chain and no stack, even from `onFatal`, the one place that
   * records why a daemon died.
   */
  const describe = (error: unknown): string => {
    if (error instanceof Error) return error.stack ?? error.message
    // `inspect` rather than `JSON.stringify`, which throws on a cycle and
    // drops a `message` living on the prototype — both of which a plugin's
    // error object can have.
    return typeof error === 'object' && error !== null
      ? inspect(error, { depth: 3, breakLength: Infinity })
      : String(error)
  }

  // A daemon that dies without running `shutdown()` leaves its socket and run
  // file behind, so the next client finds a profile that looks live and waits
  // out its connect timeout. `main().catch` cannot cover this: an uncaught
  // exception or an unhandled rejection after startup never becomes a
  // rejection of `main`.
  const onFatal = (what: string) => (error: unknown) => {
    const message = describe(error)
    console.error(`[edge-engine] ${what}: ${message}`)
    try {
      logger.error(what, { error: message })
    } catch {
      // The logger itself may be what failed.
    }
    shutdown('fatal').catch(() => {})
  }
  process.on('uncaughtException', onFatal('uncaught exception'))
  /**
   * An unhandled rejection is reported, not fatal.
   *
   * Fatal is Node's own default since v15 and the right default for a
   * script. It is the wrong one for a daemon that hosts third-party plugins
   * in its own process: a plugin's forgotten `.catch` would take down every
   * session, every live `subscribe` stream and every object handle in the
   * engine, and the next command would silently spawn a fresh engine that is
   * no longer logged in.
   *
   * An `uncaughtException` stays fatal, because a throw that nothing caught
   * unwound a stack and left state nobody can reason about. A rejection
   * nobody awaited did not: whatever was going to use that value simply has
   * none, which is the plugin's problem and not the engine's. So this is
   * reported at `error` level with the full value — loudly enough to find,
   * which is what `describe` above is for — and the engine stays up.
   */
  process.on('unhandledRejection', (error: unknown) => {
    const message = describe(error)
    console.error(`[edge-engine] unhandled rejection: ${message}`)
    try {
      logger.error('unhandled rejection', { error: message })
    } catch {
      // The logger itself may be what failed.
    }
  })

  /**
   * One stray rejection, for the suite that proves it is survivable.
   *
   * The handler above is the only thing standing between a plugin's
   * forgotten `.catch` and every session in the daemon, and nothing else
   * reaches it: the fake world registers only the plugins it builds wallets
   * for, so no offline suite can produce the real failure, and the handler
   * is installed inside `main()` where a unit test cannot see it. So the
   * engine makes one on request. Rejected with a plain *object*, because
   * that is the shape a plugin uses and the shape `String(error)` renders
   * as `[object Object]`.
   *
   * Read once at boot and never again; `unref`, so it cannot hold the
   * process open on its own.
   */
  if (process.env.EDGE_CLI_TEST_UNHANDLED_REJECTION === '1') {
    unrefTimer(
      setTimeout(() => {
        // A plain object is the point of this seam, not an oversight: the
        // defect it reproduces is a plugin rejecting with one, so an
        // `Error` here would test nothing.
        // eslint-disable-next-line @typescript-eslint/no-floating-promises, @typescript-eslint/prefer-promise-reject-errors
        Promise.reject({
          testMarker: 'edge-cli-test-rejection',
          message: 'a plugin rejected with a plain object'
        })
      }, 50)
    )
  }

  // `core.testMode`, like the run file and both status routes: the
  // argv-derived value is false under `--fake`, so the line a
  // `npm run engine` user reads would announce `testMode=false` on an engine
  // talking to `fake://login`, and write the same into
  // `engine-<profile>.log`.
  console.error(
    `[edge-engine] Ready (pid=${process.pid}, profile=${profile}, testMode=${core.testMode}, log=${logger.logPath})`
  )
  logger.info('Ready', { pid: process.pid, profile, testMode: core.testMode })
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
  // plugin that throws — clears what it claimed, or the next client would
  // find a profile that looks live and wait out its connect timeout. The
  // startup log is kept: it is the only record of what happened.
  if (claimedProfile != null) {
    removeRunArtifacts(claimedProfile, {
      claim: ownClaim,
      keepStartupLog: true,
      keepSocket: !boundSocket,
      keepSession: !boundSocket
    })
  }
  process.exit(1)
})
