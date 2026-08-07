import {
  addEdgeCorePlugins,
  type EdgeContext,
  type EdgeCorePluginsInit,
  lockEdgeCorePlugins,
  makeEdgeContext
} from 'edge-core-js'
import accountbasedPluginsImport from 'edge-currency-accountbased'
import currencyPluginsImport from 'edge-currency-plugins'
import exchangePluginsImport from 'edge-exchange-plugins'

import { loadAppConfig } from './appConfig'
import { defaultDirectory } from './cliConfig'
import type { EventHub } from './events'
import { loadKeys } from './keysConfig'
import type { EngineLogger } from './logger'
import { hasNodeApiSigner, makeNodeApiSigner } from './nodeApiSigner'
import { TESTER_SERVERS } from './testerServers'

let pluginsLocked = false

/**
 * CJS/ESM interop: these packages often export `{ default: { bitcoin, … } }`.
 */
function unwrapPlugins(mod: Record<string, unknown>): Record<string, unknown> {
  const inner = mod.default
  if (
    inner != null &&
    typeof inner === 'object' &&
    !Array.isArray(inner) &&
    Object.keys(mod).length <= 2
  ) {
    return inner as Record<string, unknown>
  }
  return mod
}

function mergePluginInit(
  configValue: unknown,
  keysValue: unknown
): boolean | Record<string, unknown> {
  if (configValue === false || keysValue === false) return false
  const cfg =
    configValue != null &&
    typeof configValue === 'object' &&
    !Array.isArray(configValue)
      ? { ...(configValue as Record<string, unknown>) }
      : {}
  const keys =
    keysValue != null &&
    typeof keysValue === 'object' &&
    !Array.isArray(keysValue)
      ? { ...(keysValue as Record<string, unknown>) }
      : {}
  const { enabled: cfgEnabled, ...cfgRest } = cfg
  const { enabled: keysEnabled, ...keysRest } = keys
  if (cfgEnabled === false || keysEnabled === false) return false
  const merged = { ...cfgRest, ...keysRest }
  if (Object.keys(merged).length > 0) return merged
  if (configValue === true || keysValue === true) return true
  if (configValue != null || keysValue != null) return true
  return false
}

const currencyPlugins = unwrapPlugins(
  currencyPluginsImport as unknown as Record<string, unknown>
)
const accountbasedPlugins = unwrapPlugins(
  accountbasedPluginsImport as unknown as Record<string, unknown>
)
const exchangePlugins = unwrapPlugins(
  exchangePluginsImport as unknown as Record<string, unknown>
)

function ensurePlugins(): void {
  if (pluginsLocked) return
  addEdgeCorePlugins(
    currencyPlugins as Parameters<typeof addEdgeCorePlugins>[0]
  )
  addEdgeCorePlugins(
    accountbasedPlugins as Parameters<typeof addEdgeCorePlugins>[0]
  )
  addEdgeCorePlugins(
    exchangePlugins as Parameters<typeof addEdgeCorePlugins>[0]
  )
  lockEdgeCorePlugins()
  pluginsLocked = true
}

export interface MakeCoreContextOpts {
  apiKey?: string
  appId?: string
  directory?: string
  testMode?: boolean
  events: EventHub
  logger?: EngineLogger
}

export interface CoreContextBundle {
  context: EdgeContext
  appId: string
  testMode: boolean
  directory: string
  servers: {
    loginServer?: string
    infoServer?: string
    changeServer?: string
    syncServer?: string | string[]
  }
  pluginsInit: EdgeCorePluginsInit
}

export async function makeCoreContext(
  opts: MakeCoreContextOpts
): Promise<CoreContextBundle> {
  ensurePlugins()
  const keysConfig = loadKeys()
  const appConfig = loadAppConfig()
  const pluginsInit: EdgeCorePluginsInit = {}

  for (const pluginId of Object.keys(currencyPlugins)) {
    const pluginKeys = keysConfig.pluginApiKeys[pluginId]
    if (pluginKeys != null && typeof pluginKeys === 'object') {
      pluginsInit[pluginId] = pluginKeys as Record<string, unknown>
    } else {
      pluginsInit[pluginId] = true
    }
  }

  for (const pluginId of Object.keys(accountbasedPlugins)) {
    const pluginKeys = keysConfig.pluginApiKeys[pluginId]
    if (pluginKeys === false) {
      pluginsInit[pluginId] = false
    } else if (pluginKeys != null && typeof pluginKeys === 'object') {
      const { enabled, ...rest } = pluginKeys as Record<string, unknown>
      if (enabled === false) {
        pluginsInit[pluginId] = false
      } else {
        pluginsInit[pluginId] = Object.keys(rest).length > 0 ? rest : true
      }
    } else {
      pluginsInit[pluginId] = true
    }
  }

  const swapConfig = appConfig.swapPlugins ?? {}
  for (const pluginId of Object.keys(exchangePlugins)) {
    pluginsInit[pluginId] = mergePluginInit(
      swapConfig[pluginId],
      keysConfig.pluginApiKeys[pluginId]
    )
  }

  const appId = opts.appId ?? ''
  const directory = opts.directory ?? defaultDirectory()
  const testMode = opts.testMode === true
  const effectiveApiKey = opts.apiKey ?? keysConfig.edgeApiKey
  const apiSecret =
    keysConfig.edgeApiSecret != null
      ? Buffer.from(keysConfig.edgeApiSecret, 'hex')
      : undefined
  const useNativeSigner = hasNodeApiSigner()
  const apiSigner = useNativeSigner ? makeNodeApiSigner() : undefined

  const servers = testMode
    ? {
        loginServer: TESTER_SERVERS.loginServer,
        infoServer: TESTER_SERVERS.infoServer,
        changeServer: TESTER_SERVERS.changeServer,
        syncServer: [...TESTER_SERVERS.syncServer]
      }
    : {}

  if (testMode) {
    opts.logger?.info('Using tester servers', { servers })
  }
  if (useNativeSigner) {
    opts.logger?.info('Using Node native Edge API HMAC signer')
  }

  const enabledSwap = Object.keys(exchangePlugins).filter(
    id => pluginsInit[id] !== false && pluginsInit[id] != null
  )
  opts.logger?.info('Swap plugins enabled', { plugins: enabledSwap })

  const context = await makeEdgeContext({
    ...(apiSigner != null
      ? { apiSigner }
      : {
          apiKey: effectiveApiKey,
          apiSecret
        }),
    appId,
    path: directory,
    plugins: pluginsInit,
    ...servers,
    onLog(event) {
      opts.logger?.write(String(event.type ?? 'info'), event.message, {
        source: event.source
      })
      opts.events.emit('core.log', {
        source: event.source,
        message: event.message,
        type: event.type
      })
    }
  })

  return {
    context,
    appId,
    testMode,
    directory,
    servers,
    pluginsInit
  }
}
