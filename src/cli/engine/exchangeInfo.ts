import {
  asExchangeInfo,
  type ExchangeInfo
} from '../../actions/ExchangeInfoActions'
import { fetchPublicRollup, infoServerData } from '../../util/network'
import { errorMessage } from './errors'
import type { EngineReporter } from './logger'

/**
 * The info server's `exchangeInfo`, for `fetch-swap-quotes`.
 *
 * It is Edge's remote switch for swaps: providers turned off outright or for
 * one asset, and assets no provider may swap. The app reads it from the
 * public info rollup, which it fetches every five minutes, so the engine
 * fetches the same rollup when a quote is asked for and the last one it read
 * is older than that.
 *
 * With no source configured — the fake world, and the tests — it answers the
 * defaults, which disable nothing, as the app does before its first rollup
 * arrives.
 */
let source: (() => Promise<ExchangeInfo>) | undefined

/** Set where `currentExchangeInfo` reads from; `undefined` for the defaults. */
export function configureExchangeInfo(
  next: (() => Promise<ExchangeInfo>) | undefined
): void {
  source = next
}

/** The `exchangeInfo` a swap quote is asked under. */
export async function currentExchangeInfo(): Promise<ExchangeInfo> {
  if (source == null) return asExchangeInfo({})
  return await source()
}

/** The app's rollup interval, `INFO_FETCH_INTERVAL` in `network.ts`. */
const EXCHANGE_INFO_TTL_MS = 5 * 60 * 1000

/**
 * The real source: the public rollup, fetched again once the last one read
 * is older than the app's interval.
 *
 * A fetch that fails, or a rollup without an `exchangeInfo`, keeps the last
 * one read, or the defaults if there is none, and is tried again on the next
 * quote. `fetchPublicRollup` reports its own failures.
 */
export function makeRollupExchangeInfo(
  report: Pick<EngineReporter, 'warn'>
): () => Promise<ExchangeInfo> {
  let current: { info: ExchangeInfo; at: number } | undefined
  return async () => {
    if (current != null && Date.now() - current.at < EXCHANGE_INFO_TTL_MS) {
      return current.info
    }
    const before = infoServerData.rollupRaw
    await fetchPublicRollup()
    const raw = infoServerData.rollupRaw as
      | { exchangeInfo?: unknown }
      | undefined
    // A rollup that arrived is a new object, so the same one means none did.
    if (raw === before) return current?.info ?? asExchangeInfo({})
    // As the app does: its cleaner refuses a missing object, so it keeps the
    // last one. Read as `{}`, a rollup without one would turn every remote
    // disable off until the next rollup.
    if (raw?.exchangeInfo == null) {
      report.warn(
        'The info rollup carries no exchangeInfo, so swap quotes use the last one read'
      )
      return current?.info ?? asExchangeInfo({})
    }
    try {
      const info = asExchangeInfo(raw.exchangeInfo)
      current = { info, at: Date.now() }
      return info
    } catch (error: unknown) {
      report.warn(
        `The info rollup's exchangeInfo is unreadable, so swap quotes use the last one read: ${errorMessage(
          error
        )}`
      )
      return current?.info ?? asExchangeInfo({})
    }
  }
}
