import { getAppliedLocale } from '../../../locales/bootLocale'
import { API_VERSION, type Router } from '../router'

export function registerStatusRoutes(router: Router): void {
  router.add('GET', '/engine/status', ctx => {
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
  })

  router.add('GET', '/engine/config', ctx => {
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
  })

  router.add('POST', '/engine/stop', ctx => {
    // Respond first; process.exit inside shutdown would otherwise hang the client.
    setImmediate(() => {
      ctx.state.shutdown().catch(() => {})
    })
    return { ok: true }
  })
}
