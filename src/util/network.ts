import { asObject, asString, type Cleaner } from 'cleaners'
import type {
  EdgeFetchFunction,
  EdgeFetchOptions,
  EdgeFetchResponse
} from 'edge-core-js'
import { asInfoRollup, type InfoRollup } from 'edge-info-server'

import { asyncWaterfall, shuffleArray } from './utils'

export const DEFAULT_INFO_SERVERS = [
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
  // `asyncWaterfall([])` resolves `undefined`: its race is inside `for (const
  // func of asyncFuncs)`, which does not execute, so the function falls out
  // of the loop. `fetchWaterfall` would then hand that back and every caller
  // would die on `response.ok` with a `TypeError` naming nothing. The
  // referral and push lists start empty until `configureNetwork` fills them,
  // and the CLI configures only the info servers, so this is a state a real
  // caller reaches.
  if (servers.length === 0) {
    throw new Error(`No servers configured for ${path}`)
  }
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

/**
 * How long a rates request's *body* may take before it is aborted.
 *
 * A deadline around the await can only stop waiting; it cannot cancel the
 * request. Under Node's `fetch` a response resolves as soon as headers
 * arrive, so a server that answers 200 and then stalls mid-body leaves the
 * socket and the body stream open behind a caller that has already given up,
 * until undici's 300-second `bodyTimeout` — on a daemon that may be started
 * with `--idle-timeout=0`. Longer than `RATE_QUERY_TIMEOUT_MS` so the
 * caller's own deadline is what it normally sees and this is the backstop
 * underneath it.
 */
const RATES_BODY_TIMEOUT_MS = 35_000

/**
 * The rates servers, with the body read bounded by default.
 *
 * On the *default* fetch, because `doFetch` is a per-pass value that the two
 * consumers every `get-transactions` goes through do not supply: the queue
 * captures whichever function happened to arm its timer. A caller that
 * injects its own fetch keeps whatever bound that fetch has.
 */
export const fetchRates = async (
  path: string,
  options?: EdgeFetchOptions,
  timeout?: number,
  doFetch?: EdgeFetchFunction
): Promise<EdgeFetchResponse> => {
  const servers = path.startsWith('v2') ? RATES_SERVER_V2 : RATES_SERVERS
  return await multiFetch(
    servers,
    path,
    options,
    timeout,
    doFetch ?? abortingFetch(RATES_BODY_TIMEOUT_MS)
  )
}

/**
 * `fetch`, with an unref'd abort after `ms`.
 *
 * `AbortSignal.timeout` is not in this TypeScript lib, and the timer is
 * unref'd so a request in flight is never the reason a process stays alive.
 * Exported for `abortingFetch.test.ts`, which drives it against a server
 * that answers 200 and then stalls — the shape a deadline around the await
 * cannot do anything about.
 */
export function abortingFetch(ms: number): EdgeFetchFunction {
  return async (uri, opts) => {
    const controller = new AbortController()
    const timer = setTimeout(() => {
      controller.abort()
    }, ms)
    if (typeof timer === 'object' && typeof timer.unref === 'function') {
      timer.unref()
    }
    // Deliberately not cleared when `fetch` resolves: under Node a response
    // resolves at the *headers*, so clearing here would disarm the timer
    // just before the body read it exists to bound. Once the body is
    // consumed the abort is a no-op, and the timer is unref'd.
    return await fetch(uri, {
      ...(opts as RequestInit),
      signal: controller.signal
    })
  }
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

export const infoServerData: {
  rollup?: InfoRollup
  rollupRaw?: unknown
} = {}

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
    console.warn(
      'fetchPublicRollup: configureInfoServer has not run yet, so there are no device fields to send'
    )
    return
  }
  const { osType, osVersion, appVersion, appId, onRollup } = params
  try {
    const response = await fetchInfo(
      `v1/infoRollup/${appId}?os=${osType}&osVersion=${osVersion}&appVersion=${appVersion}`
    )
    if (!response.ok) {
      console.warn(
        `fetchPublicRollup error ${response.status}: ${await response.text()}`
      )
    } else {
      const infoData = await response.json()
      infoServerData.rollupRaw = infoData
      infoServerData.rollup = asInfoRollup(infoData)
      if (onRollup != null) await onRollup()
    }
  } catch (error: unknown) {
    // With the error. This is the only report when the rollup does not
    // arrive, and the rollup carries the plugin `appKeys` and the version
    // check — so "failed to reach the info server" for what may be a cleaner
    // rejection from `asInfoRollup`, or `fetchWaterfall`'s "No servers
    // configured", was the one line an investigator got. `initCoinrankList`
    // below has done it this way all along.
    console.warn(
      'fetchPublicRollup: Failed to reach the info server',
      String(error)
    )
  }
}

/**
 * Record the fields `fetchPublicRollup` needs.
 *
 * Separate from `initInfoServer` because the GUI can supply all of these
 * synchronously at startup, while the decision to skip the unsigned launch
 * fetch depends on an async native read. `keysStore` calls
 * `fetchPublicRollup` directly on the cold-start path, so it must not depend
 * on that await having finished.
 */
export function configureInfoServer(params: InitInfoServerParams): void {
  infoServerParams = params
}

export const initInfoServer = async (
  params: InitInfoServerParams
): Promise<void> => {
  // Through `configureInfoServer` rather than assigning again: the whole
  // body of that function is this one line, and two places writing the same
  // module state is how the two drift.
  configureInfoServer(params)
  const { skipUnsignedLaunchFetch } = params

  if (infoServerPollStarted) {
    // NetInfo reconnect: live-update public rollup fields only (never KEYS).
    await fetchPublicRollup()
    return
  }
  // Claim the poll before the first await. Two NetInfo transitions racing
  // through the awaits below would otherwise each install an interval.
  infoServerPollStarted = true

  // Launch: skip a parallel unsigned fetch when keys boot will sign one (that
  // response fills in-memory rollup + appKeys). Unsigned is enough when this
  // build has no HMAC credentials. When the signed path is taken but fails to
  // populate the rollup, `keysStore` calls `fetchPublicRollup` directly: the
  // decision cannot be made here, because at this point the signed fetch is
  // usually still in flight rather than failed.
  if (infoServerData.rollup == null && skipUnsignedLaunchFetch !== true) {
    await fetchPublicRollup()
  }

  setInterval(() => {
    fetchPublicRollup().catch(() => {
      // Already caught in `fetchPublicRollup`
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
  } catch (error: unknown) {
    console.warn(
      'initCoinrankList: Failed to fetch coinrank list',
      String(error)
    )
  }
}
