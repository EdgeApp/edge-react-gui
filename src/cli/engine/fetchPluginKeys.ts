/**
 * Fetch plugin secrets from the info server signed infoRollup (`appKeys`)
 * the same way the GUI `keysStore` does, using the Node native HMAC addon
 * when available.
 */
import { asMaybe } from 'cleaners'
import type { EdgeApiSigner } from 'edge-core-js'
import { asInfoRollup } from 'edge-info-server'
import os from 'os'

import { fetchRemoteKeys } from '../../util/keysServer'
import { configureNetwork, infoServerData } from '../../util/network'
import { TESTER_SERVERS } from './testerServers'

const PROD_INFO_SERVERS = ['https://info1.edge.app', 'https://info2.edge.app']

const APP_VERSION = require('../../../package.json').version as string

export interface FetchPluginKeysOpts {
  apiSigner?: EdgeApiSigner
  apiKey?: string
  apiSecret?: Uint8Array
  appId: string
  testMode: boolean
}

export interface FetchedPluginKeys {
  pluginApiKeys: Record<string, unknown>
  assuranceLevel?: string
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

/**
 * HMAC appKeys is a keys.json overlay (`corePlugins` / `swapPlugins`).
 * Older getKeys payloads used a top-level `pluginApiKeys` map.
 */
function pluginApiKeysFromRemote(keys: unknown): Record<string, unknown> {
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

function rememberPublicRollup(rollup: unknown): void {
  if (infoServerData.rollup != null) return
  const cleaned = asMaybe(asInfoRollup)(rollup)
  if (cleaned != null) infoServerData.rollup = cleaned
}

function cliOsParams(): {
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
    : PROD_INFO_SERVERS
  configureNetwork({ infoServers })

  const appId = getKeysAppId(opts.appId)
  const osParams = cliOsParams()
  if (opts.apiSigner != null) {
    const result = await fetchRemoteKeys({
      apiSigner: opts.apiSigner,
      appId,
      ...osParams
    })
    rememberPublicRollup(result.rollup)
    return {
      pluginApiKeys: pluginApiKeysFromRemote(result.keys),
      assuranceLevel: result.assuranceLevel
    }
  }
  if (opts.apiKey != null && opts.apiKey !== '' && opts.apiSecret != null) {
    const result = await fetchRemoteKeys({
      apiKey: opts.apiKey,
      secret: opts.apiSecret,
      appId,
      ...osParams
    })
    rememberPublicRollup(result.rollup)
    return {
      pluginApiKeys: pluginApiKeysFromRemote(result.keys),
      assuranceLevel: result.assuranceLevel
    }
  }
  throw new Error('No HMAC credentials available for infoRollup appKeys')
}
