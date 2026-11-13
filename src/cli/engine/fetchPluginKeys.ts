/**
 * Fetch plugin secrets from the info server signed infoRollup (`appKeys`)
 * the same way the GUI `keysStore` does, using the Node native HMAC addon
 * when available.
 */
import type { EdgeApiSigner } from 'edge-core-js'
import os from 'os'

import { version as APP_VERSION } from '../../../package.json'
import { fetchRemoteKeys } from '../../util/keysServer'
import { configureNetwork, DEFAULT_INFO_SERVERS } from '../../util/network'
import { isPlainObject } from '../../util/predicates'
import { TESTER_SERVERS } from './testerServers'

interface FetchPluginKeysOpts {
  apiSigner?: EdgeApiSigner
  apiKey?: string
  apiSecret?: Uint8Array
  appId: string
  testMode: boolean
  /**
   * The info-server call, injectable for its test.
   *
   * Which credential this reaches for decides whether the engine's requests
   * are signed by the native addon or by a `keys.json` secret, and the layer
   * the info server then serves — the symptom of getting it wrong shows up
   * far away, as a plugin starting with no keys at all.
   */
  fetchKeys?: typeof fetchRemoteKeys
}

interface FetchedPluginKeys {
  pluginApiKeys: Record<string, unknown>
  assuranceLevel?: string
}

/**
 * Which plugin secrets the engine runs with, out of the signed `appKeys`.
 *
 * HMAC appKeys is a keys.json overlay (`corePlugins` / `swapPlugins`);
 * older getKeys payloads used a top-level `pluginApiKeys` map. The
 * precedence is the spread: `corePlugins` beats `swapPlugins` beats the
 * legacy map, and a source that is not an object contributes nothing rather
 * than throwing — a payload shape this version does not know must not stop
 * the engine booting with the layers it does know.
 *
 * Exported for its test, as `getKeysAppId` beside it is: for a plugin named
 * in two layers this decides which key the engine uses.
 */
export function pluginApiKeysFromRemote(
  keys: unknown
): Record<string, unknown> {
  if (!isPlainObject(keys)) return {}
  const core = isPlainObject(keys.corePlugins) ? keys.corePlugins : {}
  const swap = isPlainObject(keys.swapPlugins) ? keys.swapPlugins : {}
  const legacy = isPlainObject(keys.pluginApiKeys) ? keys.pluginApiKeys : {}
  return { ...legacy, ...swap, ...core }
}

/**
 * GUI infoRollup uses theme `config.appId ?? 'edge'`. The CLI core context
 * often boots with an empty appId; the info server still expects the Edge slug.
 */
export function getKeysAppId(cliAppId: string): string {
  return cliAppId === '' ? 'edge' : cliAppId
}

// The signed response's public `rollup` is deliberately dropped: nothing in
// the engine reads `infoServerData.rollup`. Its readers (`infoUtils`,
// `versionCheck`, `keysStore` and other GUI modules) are React Native code
// the daemon never loads, and the five-minute refresh that keeps it current
// in the app is `initInfoServer`'s interval, which the engine never calls.

export function cliOsParams(): {
  os: 'ios' | 'android'
  osVersion: string
  appVersion: string
} {
  // infoRollup's HMAC cleaner only accepts the GUI's two OS tags.
  // Map Node platforms onto those: darwin matches iOS; everything else Android.
  return {
    os: os.platform() === 'darwin' ? 'ios' : 'android',
    osVersion: `${os.platform()}-${os.release()}`,
    appVersion: APP_VERSION
  }
}

export async function fetchPluginKeys(
  opts: FetchPluginKeysOpts
): Promise<FetchedPluginKeys> {
  const infoServers = opts.testMode
    ? [TESTER_SERVERS.infoServer]
    : DEFAULT_INFO_SERVERS
  configureNetwork({ infoServers })

  const appId = getKeysAppId(opts.appId)
  const osParams = cliOsParams()
  const fetchKeys = opts.fetchKeys ?? fetchRemoteKeys
  if (opts.apiSigner != null) {
    const result = await fetchKeys({
      apiSigner: opts.apiSigner,
      appId,
      ...osParams
    })
    return {
      pluginApiKeys: pluginApiKeysFromRemote(result.keys),
      assuranceLevel: result.assuranceLevel
    }
  }
  if (opts.apiKey != null && opts.apiKey !== '' && opts.apiSecret != null) {
    const result = await fetchKeys({
      apiKey: opts.apiKey,
      secret: opts.apiSecret,
      appId,
      ...osParams
    })
    return {
      pluginApiKeys: pluginApiKeysFromRemote(result.keys),
      assuranceLevel: result.assuranceLevel
    }
  }
  throw new Error('No HMAC credentials available for infoRollup appKeys')
}
