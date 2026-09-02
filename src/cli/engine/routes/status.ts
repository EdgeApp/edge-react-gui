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
import { route } from '../route'
import { API_VERSION } from '../router'
import { asOk } from '../schemas'

const asEngineStatus = asObject({
  pid: asNumber,
  apiVersion: asString,
  uptimeSeconds: asNumber,
  sessionCount: asNumber,
  testMode: asBoolean,
  idleShutdownAt: asEither(asString, asValue(null)),
  tcpPort: asEither(asNumber, asValue(null)),
  socketPath: asString,
  locale: asString,
  decimalSeparator: asString,
  groupingSeparator: asString
})

const asEngineConfig = asObject({
  appId: asString,
  testMode: asBoolean,
  directory: asString,
  servers: asObject(asString),
  plugins: asArray(asString)
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
      locale: applied.languageTag,
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
 * @note In-flight callers may see `503 ENGINE_SHUTTING_DOWN` once teardown
 *   starts.
 * @coreNote Engine lifecycle. Internally calls `context.close()`.
 */
export const engineStop = route({
  core: null,
  method: 'POST',
  path: '/engine/stop',
  cli: 'engine-stop',
  returns: asOk,

  handler(ctx) {
    // Respond first; process.exit inside shutdown would otherwise hang the client.
    setImmediate(() => {
      ctx.state.shutdown().catch(() => {})
    })
    return { ok: true }
  }
})
