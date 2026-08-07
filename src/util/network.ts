import { asObject, asString, type Cleaner } from 'cleaners'
import type {
  EdgeFetchFunction,
  EdgeFetchOptions,
  EdgeFetchResponse
} from 'edge-core-js'
import { asInfoRollup, type InfoRollup } from 'edge-info-server'

import { asyncWaterfall, shuffleArray } from './utils'

const DEFAULT_INFO_SERVERS = [
  'https://info1.edge.app',
  'https://info2.edge.app'
]
const RATES_SERVERS = ['https://rates3.edge.app', 'https://rates4.edge.app']
const RATES_SERVER_V2 = ['https://rates1.edge.app', 'https://rates2.edge.app']

const INFO_FETCH_INTERVAL = 5 * 60 * 1000 // 5 minutes

let infoServers: string[] = DEFAULT_INFO_SERVERS
let referralServers: string[] = []
let notificationServers: string[] = []
let infoServerPollStarted = false

/**
 * GUI wires referral/push/info server lists from appConfig/ENV at startup.
 * Until configured, referral/push fetches use an empty list; info defaults
 * to production hosts.
 */
export function configureNetwork(opts: {
  infoServers?: string[]
  referralServers?: string[]
  notificationServers?: string[]
}): void {
  if (opts.infoServers != null && opts.infoServers.length > 0) {
    infoServers = opts.infoServers
  }
  if (opts.referralServers != null) referralServers = opts.referralServers
  if (opts.notificationServers != null) {
    notificationServers = opts.notificationServers
  }
}

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
  return await multiFetch(infoServers, path, options, timeout, doFetch)
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
  return await multiFetch(referralServers, path, options, timeout, doFetch)
}
export const fetchPush = async (
  path: string,
  options?: EdgeFetchOptions,
  timeout?: number,
  doFetch?: EdgeFetchFunction
): Promise<EdgeFetchResponse> => {
  return await multiFetch(notificationServers, path, options, timeout, doFetch)
}

export const infoServerData: { rollup?: InfoRollup } = {}

export interface InitInfoServerParams {
  osType: string
  osVersion: string
  appVersion: string
  appId: string
  /** Called once after a successful rollup fetch (e.g. version check). */
  onRollup?: () => Promise<void>
  /**
   * When true, skip the launch unsigned fetch (HMAC signed fetch will fill
   * rollup + appKeys). Unsigned is enough when this build has no HMAC
   * credentials.
   */
  skipUnsignedLaunchFetch?: boolean
}

let infoServerParams: InitInfoServerParams | undefined

/**
 * Fetch the unsigned public info rollup. Exported so `keysStore` can fall back
 * to it when the signed infoRollup fetch fails to populate `infoServerData`:
 * that failure is only observable once the signed fetch settles, which is long
 * after `initInfoServer` has already run. Uses the parameters captured by
 * `initInfoServer`, so this module stays Node-safe.
 */
export const fetchPublicRollup = async (): Promise<void> => {
  const params = infoServerParams
  if (params == null) {
    console.warn('fetchPublicRollup: initInfoServer has not run yet')
    return
  }
  const { osType, osVersion, appVersion, appId, onRollup } = params
  try {
    const response = await fetchInfo(
      `v1/infoRollup/${appId}?os=${osType}&osVersion=${osVersion}&appVersion=${appVersion}`
    )
    if (!response.ok) {
      console.warn(
        `initInfoServer error ${response.status}: ${await response.text()}`
      )
    } else {
      const infoData = await response.json()
      infoServerData.rollup = asInfoRollup(infoData)
      if (onRollup != null) await onRollup()
    }
  } catch (e) {
    console.warn('initInfoServer: Failed to ping info server')
  }
}

export const initInfoServer = async (
  params: InitInfoServerParams
): Promise<void> => {
  infoServerParams = params
  const { skipUnsignedLaunchFetch } = params

  const queryInfo = fetchPublicRollup

  if (infoServerPollStarted) {
    // NetInfo reconnect: live-update public rollup fields only (never KEYS).
    await queryInfo()
    return
  }
  // Claim the poll before the first await. Two NetInfo transitions racing
  // through the awaits below would otherwise each install an interval.
  infoServerPollStarted = true

  // Launch: skip a parallel unsigned fetch when keys boot will sign one (that
  // response fills in-memory rollup + appKeys). Unsigned is enough when this
  // build has no HMAC credentials. When the signed path is taken but fails to
  // populate the rollup, `keysStore` calls `fetchPublicRollup` directly — the
  // decision cannot be made here, because at this point the signed fetch is
  // usually still in flight rather than failed.
  if (infoServerData.rollup == null && skipUnsignedLaunchFetch !== true) {
    await queryInfo()
  }

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
