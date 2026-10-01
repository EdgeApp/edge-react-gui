import { asMaybe } from 'cleaners'
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
import { base16 } from 'rfc4648'

import { loadAppConfig } from './appConfig'
import { defaultDirectory } from './cliConfig'
import type { EventHub } from './events'
import { fetchPluginKeys } from './fetchPluginKeys'
import { keysSearchPaths, loadKeys, mergePluginApiKeys } from './keysConfig'
import type { EngineLogger } from './logger'
import { hasNodeApiSigner, makeNodeApiSigner } from './nodeApiSigner'
import { asPluginKeysEntry } from './schemas'
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
  /**
   * An API key the operator supplied explicitly, with `-k`.
   *
   * An override: it replaces the key *and* drops the keys.json secret and
   * the native HMAC signer, which is what the guide documents `-k` and
   * `EDGE_CLI_FORCE_KEYS_JSON=1` as doing.
   */
  apiKey?: string
  /**
   * An API key from the config file.
   *
   * Used as the key when there is no explicit one, and nothing more: it does
   * not disable signing. Reading a config value as an override turned HMAC
   * signing off for anyone who put `apiKey` in `edge-cli.conf`.
   */
  configApiKey?: string
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
 * server to authenticate to. Every plugin is *registered* — `ensurePlugins`
 * runs before this function is reached, for a fake context as much as a real
 * one — and only the currency plugins are *enabled*, through `pluginsInit`:
 * the swap and exchange-rate plugins exist to call other people's APIs,
 * which is exactly what this mode forbids.
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
  // Order: an explicit `-k`, then the config file, then keys.json. Only the
  // first is an override.
  const effectiveApiKey =
    opts.apiKey ?? opts.configApiKey ?? keysConfig.edgeApiKey
  // An explicit -k replaces the key, so the keys.json secret no longer belongs
  // to it. Pairing them would sign every request with a mismatched secret.
  // A key from the config file is *not* an override — it is just where the
  // key came from — so it keeps the secret and the native signer. Treating
  // the two alike silently turned off HMAC signing for anyone who wrote
  // `apiKey` into `edge-cli.conf`, which is the opposite of what
  // `docs/EDGE_CLI.md` promises.
  const apiSecretHex =
    opts.apiKey != null ? undefined : keysConfig.edgeApiSecret
  const apiSecret =
    apiSecretHex != null
      ? base16.parse(apiSecretHex.replace(/^0x/i, '').toUpperCase())
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
    const monero = asMaybe(asPluginKeysEntry)(remote.pluginApiKeys.monero)
    const moneroHasKey = monero?.edgeApiKey != null && monero.edgeApiKey !== ''
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
      return
    }
    if (pluginKeys == null) {
      pluginsInit[pluginId] = true
      return
    }
    // `true` is this repo's spelling for "enabled, no init options": it is
    // what `src/configKeysMerge.ts` documents, what core's own `pluginsInit`
    // takes, and what `mergePluginInit` accepts on the swap path a few
    // functions above. `asPluginKeysEntry` is an `asObject`, so a boolean
    // failed it and fell into the disable-on-garbage arm below — one line in
    // a log file, and the currency silently gone from `currencyPluginIds`,
    // so the user's wallets of that type never loaded.
    if (pluginKeys === true) {
      pluginsInit[pluginId] = true
      return
    }
    const entry = asMaybe(asPluginKeysEntry)(pluginKeys)
    if (entry == null) {
      // Neither `false`, nor absent, nor a usable object. Treating this as
      // "enabled" is how a server sending `"monero": "false"` — the string —
      // switched the plugin *on* with no keys instead of disabling it.
      opts.logger?.warn(
        `Ignoring unusable plugin keys for ${pluginId}; the plugin is disabled`
      )
      pluginsInit[pluginId] = false
      return
    }
    if (entry.enabled === false) {
      pluginsInit[pluginId] = false
      return
    }
    // `asObject` materialises every declared key, so `{}` and
    // `{"enabled":true}` both clean to an object carrying
    // `edgeApiKey: undefined`. Counting those made `pluginsInit[pluginId]` an
    // object with one undefined key where it should be `true`, which also
    // stopped the `moneroInit === true` check below warning about Monero
    // enabled with no key.
    const { enabled, ...rest } = entry
    const options = Object.fromEntries(
      Object.entries(rest).filter(([, value]) => value !== undefined)
    )
    pluginsInit[pluginId] = Object.keys(options).length > 0 ? options : true
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
      const type = String(event.type ?? 'info')
      // `info` is a plugin's own poll-loop chatter and there is a lot of it:
      // 7,319 of 7,691 lines in one 9.6 MB log were a single plugin's
      // `init:` messages. It still reaches a `subscribe` stream, which is
      // where someone watching a live engine wants it; it is only kept out
      // of the file unless EDGE_CLI_LOG_LEVEL asks for it.
      if (type !== 'info' || process.env.EDGE_CLI_LOG_LEVEL === 'info') {
        opts.logger?.write(type, event.message, { source: event.source })
      }
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
