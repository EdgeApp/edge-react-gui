import {
  asArray,
  asBoolean,
  asEither,
  asNumber,
  asObject,
  asString,
  asValue
} from 'cleaners'

import { getAppliedLocale } from '../../../locales/bootLocale'
import { rateCacheSize } from '../../../util/exchangeRates'
import { API_VERSION } from '../apiVersion'
import { doc } from '../doc'
import { route } from '../route'
import { asOk } from '../schemas'

const asEngineStatus = asObject({
  pid: doc(asNumber, 'The daemon process, for `kill` when it will not stop.'),
  apiVersion: doc(
    asString,
    'The API this engine speaks. A client refusing to talk to an older engine ' +
      'checks this.'
  ),
  uptimeSeconds: doc(asNumber, 'How long the daemon has been running.'),
  sessionCount: doc(asNumber, 'Logged-in accounts held open right now.'),
  testMode: doc(
    asBoolean,
    'True when the engine is not pointed at production: the tester fleet, or the in-process fake world under `--fake`.'
  ),
  idleShutdownAt: doc(
    asEither(asString, asValue(null)),
    'When the engine will exit for want of work. Null while anything is ' +
      'holding it open — a logged-in session, a live subscription, a request ' +
      'being served, or a pending edge login, whose handle belongs to no ' +
      'session — and null when the timeout is disabled.'
  ),
  tcpPort: doc(
    asEither(asNumber, asValue(null)),
    'The loopback port, null unless started with `--tcp`.'
  ),
  socketPath: doc(asString, 'Unix socket the CLI connects to.'),
  rateCachedCount: doc(
    asNumber,
    'Exchange rates held in the engine\u2019s process cache. It is bounded and cleared when the last session goes away, and this is how an operator sees it.'
  ),
  locale: doc(asString, 'Language tag the engine resolved at boot.'),
  localeMatched: doc(
    asBoolean,
    'Whether a translation table for that tag was actually found. False means the tag was accepted but the engine is answering in English, which is otherwise indistinguishable from a build that has the language.'
  ),
  decimalSeparator: doc(asString, 'Decimal mark for that locale.'),
  groupingSeparator: doc(asString, 'Thousands mark for that locale.')
})

const asEngineConfig = asObject({
  appId: doc(asString, 'Application ID the engine was started with.'),
  testMode: doc(
    asBoolean,
    'True when the engine is not pointed at production: the tester fleet, or the in-process fake world under `--fake`. Read `servers` to tell those apart.'
  ),
  directory: doc(asString, 'Working directory holding the core data.'),
  servers: doc(
    asObject(asEither(asString, asArray(asString))),
    'The URLs this engine talks to, keyed by role. `syncServer` is a list, ' +
      'since core rotates across the sync fleet.'
  ),
  plugins: doc(asArray(asString), 'Plugin IDs the engine loaded, sorted.')
})

/**
 * Engine liveness and summary.
 *
 * The readiness probe the client polls after auto-spawning the engine.
 *
 * @returns `idleShutdownAt` is null while a session or a subscription holds
 *   the engine open, and `tcpPort` is null unless started with `--tcp`.
 * @coreNote Engine lifecycle; the daemon is not part of the core API.
 */
export const engineStatus = route({
  core: null,
  method: 'GET',
  path: '/engine/status',
  cli: 'engine-status',
  returns: asEngineStatus,
  errors: ['ENGINE_SHUTTING_DOWN'],

  handler(ctx) {
    const { state } = ctx
    const applied = getAppliedLocale()
    return {
      pid: process.pid,
      apiVersion: API_VERSION,
      uptimeSeconds: (Date.now() - state.startedAt) / 1000,
      sessionCount: state.sessions.size,
      testMode: state.core.testMode,
      idleShutdownAt: state.idle.idleShutdownAt,
      tcpPort: state.tcpPort,
      socketPath: state.socketPath,
      rateCachedCount: rateCacheSize(),
      locale: applied.languageTag,
      localeMatched: applied.matched,
      decimalSeparator: applied.decimalSeparator,
      groupingSeparator: applied.groupingSeparator
    }
  }
})

/**
 * Configured context options.
 *
 * What the engine passed to `makeEdgeContext`. Contains no secrets. Use it to
 * assert tester hosts before a test run.
 *
 * @note Outside `-t` / `--test`, `servers` is an empty object — core is using
 *   its built-in production defaults, so there is nothing to echo back.
 * @coreNote Reflects the EdgeContextOptions the engine supplied at startup.
 */
export const engineConfig = route({
  core: null,
  method: 'GET',
  path: '/engine/config',
  cli: 'engine-config',
  returns: asEngineConfig,

  handler(ctx) {
    const { core } = ctx.state
    const plugins = Object.keys(core.pluginsInit).filter(pluginId =>
      Boolean(core.pluginsInit[pluginId])
    )
    return {
      appId: core.appId,
      testMode: core.testMode,
      directory: core.directory,
      servers: core.servers,
      plugins
    }
  }
})

/**
 * Stop the engine.
 *
 * Logs out every session, closes the context, unlinks the socket and run-file,
 * then exits. The engine answers before it starts tearing down, so a response
 * is not proof the process is gone.
 *
 * @note `503 ENGINE_SHUTTING_DOWN` reaches requests that arrive *after*
 *   teardown starts, not ones already in flight: `handleRequest` tests the
 *   flag at the top only. A request already past that point is waited for —
 *   shutdown drains in-flight work before logging out — so it gets its real
 *   response. This route is exempt: a second stop is answered `ok`, because
 *   stopping an engine that is already stopping has succeeded.
 * @coreNote Engine lifecycle. Internally calls `context.close()`.
 */
export const engineStop = route({
  core: null,
  method: 'POST',
  path: '/engine/stop',
  cli: 'engine-stop',
  returns: asOk,

  handler(ctx) {
    // Idempotent: a second stop against an engine already tearing down is
    // answered `ok` rather than 503, because what was asked for is already
    // happening. `shutdown` guards itself as well, so this is belt and
    // braces — but the 503 was the harmful part, since a client that retries
    // it would start a replacement engine.
    if (ctx.state.shuttingDown) return { ok: true }
    // Respond first; process.exit inside shutdown would otherwise hang the client.
    setImmediate(() => {
      ctx.state.shutdown().catch(ctx.state.onShutdownFailure)
    })
    return { ok: true }
  }
})
