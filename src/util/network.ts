import { asObject, asString, type Cleaner } from 'cleaners'
import type {
  EdgeFetchFunction,
  EdgeFetchOptions,
  EdgeFetchResponse
} from 'edge-core-js'
import { asInfoRollup, type InfoRollup } from 'edge-info-server'

import { errorMessage } from './errorMessage'
import { makePeriodicTask, type PeriodicTask } from './PeriodicTask'
import { unrefTimer } from './raceTimeout'
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
 * The info-server poll, kept so it can be stopped and cannot overlap.
 *
 * `makePeriodicTask` rather than `setInterval`, which is the one rule the
 * async brief states flatly. Two things followed from the raw interval.
 * `fetchPublicRollup` has no ceiling of its own — `fetchWaterfall`'s
 * `timeoutMs` is `asyncWaterfall`'s per-server *stagger*, armed only when
 * more than one server is pending — so against a stalled info server the
 * polls overlapped and accumulated one pending request every five minutes
 * for the life of the app, where this measures its gap after the task
 * finishes. And the interval handle was discarded, so nothing could stop
 * the poll; `src/cli/engine/fetchPluginKeys.ts` notes that as one reason
 * the engine never calls `initInfoServer`.
 */
let infoServerPoll: PeriodicTask | undefined

/**
 * One in-flight request per resource, so a flapping link cannot stack them.
 *
 * `makePeriodicTask` ended the overlap on the *poll*, and left it intact on
 * the arm that can fire several times a second: every
 * disconnected-to-connected transition started an independent
 * `fetchPublicRollup()` and `initCoinrankList()`, both writing the same
 * module state (`infoServerData.rollup` / `rollupRaw`,
 * `coinrankListData.coins`) with nothing serialising them.
 * `infoServerPollStarted` does not cover it — that latch only stops a
 * second poll being installed, which is the branch below the reconnect one.
 *
 * `fetchPublicRollup` has no ceiling of its own, because `fetchWaterfall`'s
 * `timeoutMs` is `asyncWaterfall`'s per-server *stagger* and is armed only
 * when more than one server is pending. So against an info server that
 * accepts the connection and stalls, a lift, a train or a tethered laptop
 * accumulated one pending unsigned rollup request per transition for the
 * life of the app — and the last one to answer decided the rollup, whatever
 * order they were started in.
 *
 * A join rather than a skip: the caller wanted fresh data, and the request
 * already running will produce it.
 */
let pendingPublicRollup: Promise<void> | undefined
let pendingCoinrankList: Promise<void> | undefined

async function joinOrStart(
  slot: 'rollup' | 'coinrank',
  start: () => Promise<void>
): Promise<void> {
  const pending = slot === 'rollup' ? pendingPublicRollup : pendingCoinrankList
  if (pending != null) {
    await pending
    return
  }
  const fresh = start().finally(() => {
    if (slot === 'rollup') {
      if (pendingPublicRollup === fresh) pendingPublicRollup = undefined
    } else if (pendingCoinrankList === fresh) {
      pendingCoinrankList = undefined
    }
  })
  if (slot === 'rollup') pendingPublicRollup = fresh
  else pendingCoinrankList = fresh
  await fresh
}

/**
 * The public rollup, with at most one request outstanding.
 *
 * What the NetInfo reconnect arm calls. `fetchPublicRollup` itself stays
 * un-deduplicated, because the poll is already serialised by
 * `makePeriodicTask` and the suites drive it with an injected fetch.
 */
export const refreshPublicRollup = async (): Promise<void> => {
  await joinOrStart('rollup', async () => {
    await fetchPublicRollup()
  })
}

/** The same, for the coinrank list. */
export const refreshCoinrankList = async (): Promise<void> => {
  await joinOrStart('coinrank', initCoinrankList)
}

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
  // `asyncWaterfall([])` resolves `undefined` — it returns early when there
  // is nothing to try. `fetchWaterfall` would then hand that back and every
  // caller would die on `response.ok` with a `TypeError` naming nothing. The
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
  // `multiFetch`, whose body this used to repeat verbatim: the shuffle and
  // the waterfall are its job, and only the `ok` check and the cleaner below
  // are this function's own.
  const response = await multiFetch(servers, path, options, timeout, doFetch)
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
    // `unrefTimer`, not its body a second time: that helper was added by
    // this change so "both helpers share one timer policy", and it imports
    // nothing.
    unrefTimer(timer)
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

interface InitInfoServerParams {
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
 *
 * `doFetch` for the tests, the way `fetchWaterfall` and `cleanMultiFetch`
 * take one; production callers pass none.
 */
export const fetchPublicRollup = async (
  doFetch?: EdgeFetchFunction
): Promise<void> => {
  const params = infoServerParams
  if (params == null) {
    console.warn(
      'fetchPublicRollup: configureInfoServer has not run yet, so there are no device fields to send'
    )
    return
  }
  const { osType, osVersion, appVersion, appId, onRollup } = params
  // Three stages, each reported as what it is. One `catch` around all of
  // them said "Failed to reach the info server" for the two that are not
  // that: a rollup the cleaner rejects, and `onRollup` — the version check,
  // `runOnce('checkAppVersion', …)` — failing after the fetch plainly
  // succeeded and the rollup was stored. This is the module's one report for
  // a rollup that did not arrive, so the label has to say what happened.
  let response: Awaited<ReturnType<typeof fetchInfo>>
  try {
    response = await fetchInfo(
      `v1/infoRollup/${appId}?os=${osType}&osVersion=${osVersion}&appVersion=${appVersion}`,
      undefined,
      undefined,
      // Injectable, like `fetchWaterfall` and `cleanMultiFetch` beside it.
      // This was the one function in the file without it, which is what
      // made the three decisions it carries — the "configureInfoServer has
      // not run yet" guard, the error arm and `onRollup` — reachable from
      // no test at all, while the contract they hold is `keysStore`'s
      // cold-start fallback: when the signed fetch does not fill the
      // rollup, this call is what fills it, and a call that does nothing
      // leaves every plugin with no `appKeys` and a `console.warn` as the
      // only trace.
      doFetch
    )
  } catch (error: unknown) {
    console.warn(
      'fetchPublicRollup: Failed to reach the info server',
      errorMessage(error)
    )
    return
  }
  if (!response.ok) {
    console.warn(
      `fetchPublicRollup error ${response.status}: ${await response.text()}`
    )
    return
  }
  try {
    const infoData: unknown = await response.json()
    // Cleaned before either field is written, so a rejected rollup leaves
    // the previous one in place rather than a raw copy beside a stale one.
    const rollup = asInfoRollup(infoData)
    infoServerData.rollupRaw = infoData
    infoServerData.rollup = rollup
  } catch (error: unknown) {
    console.warn(
      'fetchPublicRollup: Could not read the info rollup',
      errorMessage(error)
    )
    return
  }
  if (onRollup == null) return
  try {
    await onRollup()
  } catch (error: unknown) {
    console.warn(
      'fetchPublicRollup: The rollup arrived, and onRollup failed',
      errorMessage(error)
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
    // Through the in-flight guard, because this arm fires once per
    // connectivity transition and a flapping link made that several times a
    // second.
    await refreshPublicRollup()
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

  // Wrapped, not passed by reference: `fetchPublicRollup` now takes an
  // optional `doFetch`, and handing the function straight to a scheduler
  // would let whatever that scheduler calls its task with land in that slot.
  infoServerPoll = makePeriodicTask(
    async () => {
      await fetchPublicRollup()
    },
    INFO_FETCH_INTERVAL,
    {
      onError: () => {
        // Already caught in `fetchPublicRollup`.
      }
    }
  )
  // `wait: true`, because the launch fetch above has already run — starting
  // in the running state would fire a second one immediately.
  infoServerPoll.start({ wait: true })
}

/**
 * Stop the info-server poll.
 *
 * Nothing in the app calls this today; it exists because a ticker whose
 * handle is thrown away cannot be stopped at all, and the engine's
 * `fetchPluginKeys` names that as a reason it keeps away from this module.
 */
export const stopInfoServerPoll = (): void => {
  infoServerPoll?.stop()
  infoServerPoll = undefined
  infoServerPollStarted = false
  // The in-flight requests cannot be cancelled, but a later `init` must not
  // join one started against the previous configuration.
  pendingPublicRollup = undefined
  pendingCoinrankList = undefined
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
