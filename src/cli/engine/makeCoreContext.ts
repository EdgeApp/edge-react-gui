import { asMaybe } from 'cleaners'
import {
  addEdgeCorePlugins,
  type EdgeContext,
  type EdgeCorePluginsInit,
  type JsonObject,
  lockEdgeCorePlugins,
  makeEdgeContext,
  makeFakeEdgeWorld
} from 'edge-core-js'
import accountbasedPluginsImport from 'edge-currency-accountbased'
import currencyPluginsImport from 'edge-currency-plugins'
import exchangePluginsImport from 'edge-exchange-plugins'

import { mergePluginInit } from '../../configKeysMerge'
import { isPlainObject } from '../../util/predicates'
import { withDeadline } from '../../util/withDeadline'
import { resolveApiCredentials } from './apiCredentials'
import { loadAppConfigFrom } from './appConfig'
import { defaultDirectory } from './cliConfig'
import { cliHomeFile } from './cliHome'
import { errorMessage } from './errors'
import type { EventHub } from './events'
import { FAKE_SERVERS } from './fakeServers'
import { fetchPluginKeys } from './fetchPluginKeys'
import { keysSearchPaths, loadKeysFrom, mergePluginApiKeys } from './keysConfig'
import type { EngineLogger } from './logger'
import { hasNodeApiSigner, makeNodeApiSigner } from './nodeApiSigner'
import { asPluginKeysEntry, withoutUndefined } from './schemas'
import { TESTER_SERVERS } from './testerServers'

/**
 * The ceiling on the signed `infoRollup` fetch during boot.
 *
 * Generous, because it is one request against a live server and the keys it
 * returns gate the plugins; finite, because it runs after the run file is
 * claimed and before the socket exists, which is the window in which a
 * silent server makes every client wait out its spawn timeout.
 */
const PLUGIN_KEYS_TIMEOUT_MS = 20_000

let pluginsLocked = false

/**
 * CJS/ESM interop: these packages often export `{ default: { bitcoin, … } }`.
 */
function unwrapPlugins(mod: Record<string, unknown>): Record<string, unknown> {
  const inner = mod.default
  // `isPlainObject` rather than its body a fourth time: that helper exists
  // to end this triplication, and `keysConfig.ts` and `router.ts` already
  // use it. Only the `<= 2` clause is this function's own.
  if (isPlainObject(inner) && Object.keys(mod).length <= 2) {
    return inner
  }
  return mod
}

/**
 * A plugin keys entry, as core's `pluginsInit` takes it.
 *
 * The one place either path interprets a value that is neither `false`, nor
 * absent, nor `true`. The currency path had these arms and the swap path had
 * none: it handed the merged value to core unexamined, so an entry whose
 * `enabled` or `edgeApiKey` was the wrong type reached a plugin's init
 * untouched, and a value the cleaner rejects outright — the *string*
 * `"false"` is the one a server really sent — had no warn-and-disable arm on
 * that side at all.
 *
 * Disabled rather than enabled, because the alternative is a plugin running
 * with keys nobody has looked at. `enabled: false` is honoured here on both
 * paths, which is a deliberate difference from the app: the app never reads
 * the field and passes it to core as an init option. `src/configKeysMerge.ts`
 * says keys are never an off switch, and that is about a keys-side bare
 * `false` wiping a baked credential; a field that says `enabled: false` is a
 * server asking for the plugin to be off, and the CLI has honoured it on the
 * currency path since it had one.
 *
 * `{}` and `{"enabled":true}` both become `true`: `asObject` materialises
 * every declared key, so each cleans to an object carrying
 * `edgeApiKey: undefined`, and counting those made the init an object with
 * one undefined key where it should be `true` — which also stopped the
 * `moneroInit === true` check below warning about Monero enabled with no key.
 */
function initFromKeysEntry(
  what: string,
  value: unknown,
  warn: ((message: string) => void) | undefined
): boolean | JsonObject {
  const entry = asMaybe(asPluginKeysEntry)(value)
  if (entry == null) {
    // `Array.isArray` first, because `typeof []` is "object" and an array is
    // the one unusable shape that used to be *accepted*.
    const kind = Array.isArray(value) ? 'array' : typeof value
    warn?.(`${what} has an unusable init (${kind}); the plugin is disabled`)
    return false
  }
  if (entry.enabled === false) return false
  const { enabled, ...rest } = entry
  const options = withoutUndefined(rest) as JsonObject
  return Object.keys(options).length > 0 ? options : true
}

/**
 * One plugin's init, as core takes it.
 *
 * The merge itself is `src/configKeysMerge.ts`'s `mergePluginInit`, which the
 * app uses and `configKeysMerge.test.ts` already pins. This engine had a
 * second function of the same name and the same signature, and the two
 * disagreed on six of ten cases I compared — so the existing suite was
 * giving assurance about code the engine did not call. Two of those
 * disagreements mattered:
 *
 *  - `config: true, keys: false` — the app answers `true` and documents why
 *    ("Keys are never an off switch: only config.json can disable a
 *    plugin"), and this answered `false`. The same remote `infoRollup` feeds
 *    both, so a keys-side `false` silently disabled a plugin in the CLI and
 *    not in the app. `config: {…}, keys: false` was the same defect.
 *  - a non-object, non-boolean keys value such as the *string* `"false"` —
 *    the app keeps the config value, and this answered `true`, switching a
 *    swap plugin on with no keys where the currency path a few functions
 *    below deliberately disables it.
 *
 * This wrapper only narrows the shared function's `unknown` to what
 * `EdgeCorePluginsInit` accepts, `boolean | JsonObject`, and names the
 * plugin when it cannot — which is the currency path's own rule applied to
 * the swap path.
 */
export function pluginInitFor(
  pluginId: string,
  configValue: unknown,
  keysValue: unknown,
  warn: ((message: string) => void) | undefined
): boolean | JsonObject {
  const merged = mergePluginInit(configValue, keysValue)
  if (typeof merged === 'boolean') return merged
  if (merged == null) return false
  // Everything else — including something core cannot take, such as a server
  // sending the string `"false"` — goes through the same arms the currency
  // path uses, which is the only reason they are a function.
  return initFromKeysEntry(`swap plugin ${pluginId}`, merged, warn)
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

interface MakeCoreContextOpts {
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
  /**
   * The `edge-cli.conf` that was read, for `engine-config` to publish.
   *
   * Passed in rather than re-derived: `index.ts` resolves `-c` and decides
   * the directory, the appId and the locale from it, so the one call whose
   * job is to say which configuration the engine is running on must name the
   * same file that answered there.
   */
  cliConfigPath?: string | null
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
 * one — and only the `edge-currency-plugins` set is *enabled*, through
 * `pluginsInit`. The swap and exchange-rate plugins exist to call other
 * people's APIs, which is exactly what this mode forbids.
 *
 * `accountbasedPlugins` is left out for the same reason, and that is the
 * first thing an author of a new offline case runs into: the real path
 * enables it beside the currency set, so an accountbased chain type —
 * `create-currency-wallets --type=wallet:ethereum` — has no plugin under
 * `--fake` and is refused. Those engines reach a configured RPC endpoint as
 * soon as a wallet exists, and the fake world intercepts no HTTP. The
 * offline suites use UTXO chain types (`wallet:bitcoin`) throughout.
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
    servers: {
      loginServer: FAKE_SERVERS.loginServer,
      syncServer: FAKE_SERVERS.syncServer
    },
    pluginsInit,
    currencyPluginIds: Object.keys(currencyPlugins),
    // The fake world reads no `keys.json` and no app `config.json`; `--fake`
    // needs no key at all. It is still started through `-c` like any other
    // engine, so the CLI config file it was given is reported.
    configFiles: {
      cwd: process.cwd(),
      keys: [],
      appConfig: null,
      cliConfig: opts.cliConfigPath ?? null
    }
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
  /**
   * Where the configuration came from, so an operator can see which one is
   * answering. Paths only — the values in them are the secrets.
   */
  configFiles: {
    cwd: string
    keys: string[]
    appConfig: string | null
    cliConfig: string | null
  }
}

export async function makeCoreContext(
  opts: MakeCoreContextOpts
): Promise<CoreContextBundle> {
  ensurePlugins()
  if (opts.fake === true) return await makeFakeCoreContext(opts)
  const { keys: keysConfig, paths: keysPaths } = loadKeysFrom()
  const { config: appConfig, path: appConfigPath } = loadAppConfigFrom()
  const pluginsInit: EdgeCorePluginsInit = {}

  const appId = opts.appId ?? ''
  const directory = opts.directory ?? defaultDirectory()
  const testMode = opts.testMode === true
  // The four decisions, lifted out so they can be tabled: `resolveApiCredentials`
  // is pure, and this call is the only thing between it and the request
  // signature. They ran in no automated test at all while they were inline,
  // because jest never passes the `--fake` return above.
  const { effectiveApiKey, apiSecret, useNativeSigner, forceKeysJson } =
    resolveApiCredentials(
      { apiKey: opts.apiKey, configApiKey: opts.configApiKey },
      keysConfig,
      {
        hasSigner: hasNodeApiSigner(),
        forceKeysJson: process.env.EDGE_CLI_FORCE_KEYS_JSON === '1'
      }
    )
  const apiSigner = useNativeSigner ? makeNodeApiSigner() : undefined

  if (apiSigner == null && effectiveApiKey === '') {
    // Names the install case, because that is the common one and the
    // message used to read as a build problem: a package from `npm install
    // -g` carries no addon and no `keys.json`, so this is the first thing
    // every command does, before the socket exists — the client reports a
    // spawn timeout and the reason is only in the startup log.
    throw new Error(
      'No Edge API key available, so the engine cannot start. A CLI ' +
        'installed from npm carries no native HMAC signer and no keys, so ' +
        'it needs a key of its own: write {"edgeApiKey": "<key>"} to ' +
        `${cliHomeFile('keys.json')}, or pass one with -k. ` +
        `Searched: ${keysSearchPaths().join(', ')}. ` +
        '`--fake` needs no key at all.'
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
  } else {
    // The other half, which used to be no line at all. Which signer is in
    // use decides which `appKeys` layer the info server serves, so an
    // operator who has built the addon and is still being served the floor
    // layer has to be able to tell "I asked for keys.json" from "the addon
    // could not be loaded" — and the failure the second one leads to names
    // HMAC credentials, not the signer.
    opts.logger?.info(
      forceKeysJson
        ? 'Signing with the keys.json pair: asked for by -k or EDGE_CLI_FORCE_KEYS_JSON'
        : 'Signing with the keys.json pair: no Edge API signer addon could be loaded'
    )
  }

  try {
    // Bounded here, because `keysServer.ts` says in so many words that it is
    // the caller's job: its `FETCH_TIMEOUT_MS` is "a per-server stagger …
    // Not a hard ceiling on the whole signed infoRollup call: with multiple
    // info servers the waterfall can outlast this value", and it names the
    // GUI's cold-start gate as what bounds the app. The engine had no
    // equivalent, so one info server that accepted a connection and never
    // answered held `makeCoreContext` open — and with it the whole boot,
    // *after* the run file was claimed and before the socket exists. Every
    // client then waits out its 30-second spawn timeout against a profile
    // that looks claimed, for as long as the server stays silent.
    //
    // The keys are an overlay with a local fallback, which is why a
    // deadline here is safe: the `catch` below already logs and carries on
    // with `keys.json`.
    const remote = await withDeadline(
      fetchPluginKeys({
        apiSigner,
        apiKey: effectiveApiKey,
        apiSecret,
        appId,
        testMode
      }),
      PLUGIN_KEYS_TIMEOUT_MS,
      'the info server did not answer'
    )
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
    const message = errorMessage(error)
    opts.logger?.warn(
      `infoRollup appKeys fetch failed; using local plugin keys: ${message}`
    )
  }

  // One adapter, because `initFromKeysEntry` takes a plain function and both
  // loops hand it the same logger.
  const warnToLog =
    opts.logger != null ? (m: string) => opts.logger?.warn(m) : undefined

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
    // Neither `false`, nor absent, nor `true`. Treating such a value as
    // "enabled" is how a server sending `"monero": "false"` — the string —
    // switched the plugin *on* with no keys instead of disabling it.
    pluginsInit[pluginId] = initFromKeysEntry(
      `plugin ${pluginId}`,
      pluginKeys,
      warnToLog
    )
  }

  for (const pluginId of Object.keys(currencyPlugins)) {
    applyCurrencyPluginKeys(pluginId)
  }

  for (const pluginId of Object.keys(accountbasedPlugins)) {
    applyCurrencyPluginKeys(pluginId)
  }

  const swapConfig = appConfig.swapPlugins ?? {}
  for (const pluginId of Object.keys(exchangePlugins)) {
    pluginsInit[pluginId] = pluginInitFor(
      pluginId,
      swapConfig[pluginId],
      keysConfig.pluginApiKeys[pluginId],
      warnToLog
    )
  }

  const moneroInit = pluginsInit.monero
  // Through the cleaner, like the reading seventy lines above this one:
  // `asPluginKeysEntry` declares `edgeApiKey: asOptional(asString)`, so the
  // cast and the `typeof` test were the cleaner's job done by hand — in the
  // same function that already does it properly for the same field.
  const moneroEdgeApiKey = asMaybe(asPluginKeysEntry)(moneroInit)?.edgeApiKey
  if (moneroInit === true) {
    opts.logger?.warn(
      'Monero enabled without edgeApiKey; Edge LWS /login will omit api_key'
    )
  } else if (moneroEdgeApiKey != null && moneroEdgeApiKey !== '') {
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
    currencyPluginIds,
    configFiles: {
      // The daemon's own cwd, which is the shell's: `spawn` passes no `cwd`,
      // and both loaders search `./<file>` before `~/.edge-cli/<file>`.
      cwd: process.cwd(),
      keys: keysPaths,
      appConfig: appConfigPath,
      cliConfig: opts.cliConfigPath ?? null
    }
  }
}
