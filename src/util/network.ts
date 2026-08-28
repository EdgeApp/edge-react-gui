import { asObject, asString, type Cleaner } from 'cleaners'
import type {
  EdgeFetchFunction,
  EdgeFetchOptions,
  EdgeFetchResponse
} from 'edge-core-js'
import { asInfoRollup, type InfoRollup } from 'edge-info-server'
import { Platform } from 'react-native'
import { getVersion } from 'react-native-device-info'

import { CONFIG } from '../config'
import { config } from '../theme/appConfig'
import { initAttestation } from './attestation'
import { willSignInfoRollup } from './edgeApiSigner'
import { INFO_TEST_SERVER, shouldUseTestServers } from './maestro'
import { runOnce } from './runOnce'
import { asyncWaterfall, getOsVersion, shuffleArray } from './utils'
import { checkAppVersion } from './versionCheck'
// Cheese/tester WIP: tester info host wins over CONFIG.INFO_SERVER.
const INFO_SERVERS = shouldUseTestServers()
  ? [INFO_TEST_SERVER]
  : CONFIG.INFO_SERVER != null && CONFIG.INFO_SERVER.length > 0
  ? CONFIG.INFO_SERVER
  : ['https://info1.edge.app', 'https://info2.edge.app']
const RATES_SERVERS = ['https://rates3.edge.app', 'https://rates4.edge.app']
const RATES_SERVER_V2 = ['https://rates1.edge.app', 'https://rates2.edge.app']

const INFO_FETCH_INTERVAL = 5 * 60 * 1000 // 5 minutes

export async function fetchWaterfall(
  servers: string[],
  path: string,
  options?: EdgeFetchOptions,
  timeout: number = 5000,
  doFetch: EdgeFetchFunction = fetch
): Promise<EdgeFetchResponse> {
  const funcs = servers.map(server => async () => {
    const result = await doFetch(server + '/' + path, options)
    if (typeof result !== 'object') {
      const msg = `Invalid return value ${path} in ${server}`
      console.log(msg)
      throw new Error(msg)
    }
    return result
  })
  return await asyncWaterfall(funcs, timeout)
}

export async function cleanMultiFetch<T>(
  cleaner: Cleaner<T>,
  servers: string[],
  path: string,
  options?: EdgeFetchOptions,
  timeout: number = 5000,
  doFetch?: EdgeFetchFunction
): Promise<T> {
  const response = await fetchWaterfall(
    shuffleArray(servers),
    path,
    options,
    timeout,
    doFetch
  )
  if (!response.ok) {
    const text = await response.text()
    console.error(text)
    throw new Error(`Error fetching ${path}: ${text}`)
  }
  const responseJson = await response.json()
  const out = cleaner(responseJson)
  return out
}

async function multiFetch(
  servers: string[],
  path: string,
  options?: EdgeFetchOptions,
  timeout: number = 5000,
  doFetch?: EdgeFetchFunction
): Promise<EdgeFetchResponse> {
  return await fetchWaterfall(
    shuffleArray(servers),
    path,
    options,
    timeout,
    doFetch
  )
}

export const fetchInfo = async (
  path: string,
  options?: EdgeFetchOptions,
  timeout?: number,
  doFetch?: EdgeFetchFunction
): Promise<EdgeFetchResponse> => {
  return await multiFetch(INFO_SERVERS, path, options, timeout, doFetch)
}
export const fetchRates = async (
  path: string,
  options?: EdgeFetchOptions,
  timeout?: number,
  doFetch?: EdgeFetchFunction
): Promise<EdgeFetchResponse> => {
  const servers = path.startsWith('v2') ? RATES_SERVER_V2 : RATES_SERVERS
  return await multiFetch(servers, path, options, timeout, doFetch)
}
export const fetchReferral = async (
  path: string,
  options?: EdgeFetchOptions,
  timeout?: number,
  doFetch?: EdgeFetchFunction
): Promise<EdgeFetchResponse> => {
  return await multiFetch(
    config.referralServers ?? [],
    path,
    options,
    timeout,
    doFetch
  )
}
export const fetchPush = async (
  path: string,
  options?: EdgeFetchOptions,
  timeout?: number,
  doFetch?: EdgeFetchFunction
): Promise<EdgeFetchResponse> => {
  return await multiFetch(
    config.notificationServers,
    path,
    options,
    timeout,
    doFetch
  )
}

export const infoServerData: { rollup?: InfoRollup } = {}

let infoServerPollStarted = false

export const initInfoServer = async (): Promise<void> => {
  // Start the background attestation engine at boot (best-effort, non-blocking)
  // so a token is usually cached before any attestation-gated request is made.
  // This is intentionally not inside fetchInfo: the fetch wrapper carries no
  // attestation logic; gated plugins attach the token via getAttestationToken().
  initAttestation()

  const osType = Platform.OS.toLowerCase()
  const osVersion = getOsVersion()
  const version = getVersion()

  const queryInfo = async (): Promise<void> => {
    try {
      const response = await fetchInfo(
        `v1/infoRollup/${
          config.appId ?? 'edge'
        }?os=${osType}&osVersion=${osVersion}&appVersion=${version}`
      )
      if (!response.ok) {
        console.warn(
          `initInfoServer error ${response.status}: ${await response.text()}`
        )
      } else {
        const infoData = await response.json()
        infoServerData.rollup = asInfoRollup(infoData)
        await runOnce('checkAppVersion', checkAppVersion)
      }
    } catch (e) {
      console.warn('initInfoServer: Failed to ping info server')
    }
  }

  if (infoServerPollStarted) {
    // NetInfo reconnect: live-update public rollup fields only (never KEYS).
    await queryInfo()
    return
  }

  // Launch: skip a parallel unsigned fetch when keys boot will sign one
  // (that response fills in-memory rollup + appKeys). Unsigned is enough
  // when this build has no HMAC credentials.
  if (infoServerData.rollup == null && !willSignInfoRollup()) {
    await queryInfo()
  }

  infoServerPollStarted = true
  setInterval(() => {
    queryInfo().catch(() => {
      // Already caught in `queryInfo`
    })
  }, INFO_FETCH_INTERVAL)
}

const asCoinrankList = asObject(asString)

const asCoinGeckoCoinsResponse = asObject({
  data: asCoinrankList
})

export type CoinrankList = ReturnType<typeof asCoinrankList>

export const coinrankListData: { coins: CoinrankList } = { coins: {} }
export const initCoinrankList = async (): Promise<void> => {
  try {
    const response = await fetchRates('v2/coinrankList')
    if (!response.ok) {
      const text = await response.text()
      throw new Error(`initCoinrankList error ${response.status}: ${text}`)
    }
    const responseJson = await response.json()
    const { data } = asCoinGeckoCoinsResponse(responseJson)

    coinrankListData.coins = data
    console.log('initCoinrankList: Successfully fetched coingecko list')
  } catch (e) {
    console.warn('initCoinrankList: Failed to fetch coinrank list', String(e))
  }
}
