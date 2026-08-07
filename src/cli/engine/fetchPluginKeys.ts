/**
 * Fetch plugin secrets from the info server (`GET /v1/getKeys`) the same way
 * the GUI does, signed with the Node native HMAC addon when available.
 */
import type { EdgeApiSigner } from 'edge-core-js'

import { fetchRemoteKeys } from '../../util/keysServer'
import { configureNetwork } from '../../util/network'
import { TESTER_SERVERS } from './testerServers'

const PROD_INFO_SERVERS = ['https://info1.edge.app', 'https://info2.edge.app']

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

function pluginApiKeysFromRemote(keys: unknown): Record<string, unknown> {
  if (keys == null || typeof keys !== 'object' || Array.isArray(keys)) {
    return {}
  }
  const pluginApiKeys = (keys as { pluginApiKeys?: unknown }).pluginApiKeys
  if (
    pluginApiKeys == null ||
    typeof pluginApiKeys !== 'object' ||
    Array.isArray(pluginApiKeys)
  ) {
    return {}
  }
  return pluginApiKeys as Record<string, unknown>
}

/**
 * GUI getKeys uses theme `config.appId ?? 'edge'`. The CLI core context often
 * boots with an empty appId; the info server still expects the Edge slug.
 */
export function getKeysAppId(cliAppId: string): string {
  return cliAppId === '' ? 'edge' : cliAppId
}

export async function fetchPluginKeys(
  opts: FetchPluginKeysOpts
): Promise<FetchedPluginKeys> {
  const infoServers = opts.testMode
    ? [TESTER_SERVERS.infoServer]
    : PROD_INFO_SERVERS
  configureNetwork({ infoServers })

  const appId = getKeysAppId(opts.appId)
  if (opts.apiSigner != null) {
    const result = await fetchRemoteKeys({ apiSigner: opts.apiSigner, appId })
    return {
      pluginApiKeys: pluginApiKeysFromRemote(result.keys),
      assuranceLevel: result.assuranceLevel
    }
  }
  if (opts.apiKey != null && opts.apiKey !== '' && opts.apiSecret != null) {
    const result = await fetchRemoteKeys({
      apiKey: opts.apiKey,
      secret: opts.apiSecret,
      appId
    })
    return {
      pluginApiKeys: pluginApiKeysFromRemote(result.keys),
      assuranceLevel: result.assuranceLevel
    }
  }
  throw new Error('No HMAC credentials available for getKeys')
}
