import {
  addEdgeCorePlugins,
  type EdgeContext,
  type EdgeCorePluginsInit,
  lockEdgeCorePlugins,
  makeEdgeContext,
  makeFakeEdgeWorld
} from 'edge-core-js'
import accountbasedPluginsImport from 'edge-currency-accountbased'
import currencyPluginsImport from 'edge-currency-plugins'
import exchangePluginsImport from 'edge-exchange-plugins'

import { loadAppConfig } from './appConfig'
import { defaultDirectory } from './cliConfig'
import type { EventHub } from './events'
import { fetchPluginKeys } from './fetchPluginKeys'
import { keysSearchPaths, loadKeys, mergePluginApiKeys } from './keysConfig'
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
  /**
   * Serve a `makeFakeEdgeWorld` context instead of talking to a server.
   *
   * The login, info and sync servers are emulated in-process and currency
   * plugins are cut off from the network, so the whole API can be exercised
   * with no account, no key and no internet. That is what lets the CLI tests
   * run in a pre-commit hook.
   */
  fake?: boolean
  events: EventHub
  logger?: EngineLogger
}

/**
 * A context backed by the in-process fake world.
 *
 * No API key is needed and `fetchPluginKeys` is skipped, because there is no
 * server to authenticate to. Only the currency plugins are registered: the
 * swap and exchange-rate plugins exist to call other people's APIs, which is
 * exactly what this mode forbids.
 */
async function makeFakeCoreContext(
  opts: MakeCoreContextOpts
): Promise<CoreContextBundle> {
  const appId = opts.appId ?? ''
  const directory = opts.directory ?? defaultDirectory()
  const pluginsInit: EdgeCorePluginsInit = {}
  for (const id of Object.keys(currencyPlugins)) pluginsInit[id] = true

  const world = await makeFakeEdgeWorld([], {
    onLog(event) {
      opts.logger?.write(String(event.type ?? 'info'), event.message, {
        source: event.source
      })
    }
  })
  const context = await world.makeEdgeContext({
    appId,
    apiKey: 'fake',
    cleanDevice: true,
    plugins: pluginsInit
  })
  opts.logger?.info('Using the fake world; no network, no server')

  return {
    context,
    appId,
    testMode: true,
    directory,
    servers: { loginServer: 'fake://login', syncServer: 'fake://sync' },
    pluginsInit,
    currencyPluginIds: Object.keys(currencyPlugins)
  }
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
  /** Enabled currency/accountbased plugin ids (not swap). For wallet-create. */
  currencyPluginIds: string[]
}

export async function makeCoreContext(
  opts: MakeCoreContextOpts
): Promise<CoreContextBundle> {
  ensurePlugins()
  if (opts.fake === true) return await makeFakeCoreContext(opts)
  const keysConfig = loadKeys()
  const appConfig = loadAppConfig()
  const pluginsInit: EdgeCorePluginsInit = {}

  const appId = opts.appId ?? ''
  const directory = opts.directory ?? defaultDirectory()
  const testMode = opts.testMode === true
  const effectiveApiKey = opts.apiKey ?? keysConfig.edgeApiKey
  // An explicit -k replaces the key, so the keys.json secret no longer belongs
  // to it. Pairing them would sign every request with a mismatched secret.
  const apiSecretHex =
    opts.apiKey != null ? undefined : keysConfig.edgeApiSecret
  const apiSecret =
    apiSecretHex != null
      ? Buffer.from(apiSecretHex.replace(/^0x/i, ''), 'hex')
      : undefined
  // Explicit -k / EDGE_CLI_FORCE_KEYS_JSON skips the N-API signer so operators
  // can point a native-built engine at alternate keys for tester/debug.
  const forceKeysJson =
    opts.apiKey != null || process.env.EDGE_CLI_FORCE_KEYS_JSON === '1'
  const useNativeSigner = !forceKeysJson && hasNodeApiSigner()
  const apiSigner = useNativeSigner ? makeNodeApiSigner() : undefined

  if (apiSigner == null && effectiveApiKey === '') {
    throw new Error(
      'No Edge API key available. Pass one with -k, build the native signer, ' +
        `or add "edgeApiKey" to one of: ${keysSearchPaths().join(', ')}`
    )
  }

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

  try {
    const remote = await fetchPluginKeys({
      apiSigner,
      apiKey: effectiveApiKey,
      apiSecret,
      appId,
      testMode
    })
    keysConfig.pluginApiKeys = mergePluginApiKeys(
      remote.pluginApiKeys,
      keysConfig.pluginApiKeys
    )
    const monero = remote.pluginApiKeys.monero
    const moneroHasKey =
      monero != null &&
      typeof monero === 'object' &&
      typeof (monero as { edgeApiKey?: unknown }).edgeApiKey === 'string' &&
      (monero as { edgeApiKey: string }).edgeApiKey !== ''
    opts.logger?.info('Fetched infoRollup appKeys', {
      pluginApiKeys: Object.keys(remote.pluginApiKeys).length,
      moneroEdgeApiKey: moneroHasKey,
      assuranceLevel: remote.assuranceLevel,
      signer: apiSigner != null ? 'native' : 'js'
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    opts.logger?.warn(
      `infoRollup appKeys fetch failed; using local plugin keys: ${message}`
    )
  }

  const applyCurrencyPluginKeys = (pluginId: string): void => {
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

  for (const pluginId of Object.keys(currencyPlugins)) {
    applyCurrencyPluginKeys(pluginId)
  }

  for (const pluginId of Object.keys(accountbasedPlugins)) {
    applyCurrencyPluginKeys(pluginId)
  }

  const swapConfig = appConfig.swapPlugins ?? {}
  for (const pluginId of Object.keys(exchangePlugins)) {
    pluginsInit[pluginId] = mergePluginInit(
      swapConfig[pluginId],
      keysConfig.pluginApiKeys[pluginId]
    )
  }

  const moneroInit = pluginsInit.monero
  const moneroEdgeApiKey =
    typeof moneroInit === 'object' && moneroInit != null
      ? (moneroInit as { edgeApiKey?: unknown }).edgeApiKey
      : undefined
  if (moneroInit === true) {
    opts.logger?.warn(
      'Monero enabled without edgeApiKey; Edge LWS /login will omit api_key'
    )
  } else if (typeof moneroEdgeApiKey === 'string' && moneroEdgeApiKey !== '') {
    opts.logger?.info('Monero LWS edgeApiKey configured')
  }

  const enabledSwap = Object.keys(exchangePlugins).filter(
    id => pluginsInit[id] !== false && pluginsInit[id] != null
  )
  opts.logger?.info('Swap plugins enabled', { plugins: enabledSwap })

  const currencyPluginIds = [
    ...Object.keys(currencyPlugins),
    ...Object.keys(accountbasedPlugins)
  ].filter(id => pluginsInit[id] !== false && pluginsInit[id] != null)

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
    pluginsInit,
    currencyPluginIds
  }
}
