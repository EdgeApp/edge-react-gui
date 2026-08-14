import { lt, mul, toFixed } from 'biggystring'
import {
  asArray,
  asObject,
  asOptional,
  asString,
  asValue,
  type Cleaner
} from 'cleaners'

import { asBiggystring } from '../../util/cleaners'

/**
 * Types and cleaners for the Slipstream Connect API (https://api.papi.market),
 * a cross-venue prediction markets aggregator over Polymarket, Hyperliquid,
 * and Kalshi. See https://github.com/tylerthebuildor/slipstream-example
 *
 * API conventions: numbers are decimal strings (never floats), prices are
 * `0`-`1` probabilities, sizes are in contracts, and times are RFC3339.
 */

export const PREDICTION_MARKET_CATEGORIES = [
  'sports',
  'crypto',
  'macro',
  'politics'
] as const

export type PredictionMarketCategory =
  (typeof PREDICTION_MARKET_CATEGORIES)[number]

export const asPredictionMarketCategory: Cleaner<PredictionMarketCategory> =
  asValue('sports', 'crypto', 'macro', 'politics')

/** Best bid/ask a single venue shows for the market's YES outcome. */
export const asVenuePrice = asObject({
  venue: asString,
  best_ask: asOptional(asBiggystring),
  best_bid: asOptional(asBiggystring)
})
export type VenuePrice = ReturnType<typeof asVenuePrice>

/** One price level of the merged book, tagged with its source venue. */
export const asBookLevel = asObject({
  price: asBiggystring,
  size: asBiggystring,
  venue: asString
})
export type BookLevel = ReturnType<typeof asBookLevel>

/**
 * Merged order book across venues, normalized to the YES frame: `asks` is
 * always what it costs to buy, `bids` what you get to sell.
 */
export const asMarketBook = asObject({
  bids: asOptional(asArray(asBookLevel), () => []),
  asks: asOptional(asArray(asBookLevel), () => []),
  best_bid: asOptional(asBiggystring),
  best_ask: asOptional(asBiggystring)
})
export type MarketBook = ReturnType<typeof asMarketBook>

/** The market's listing on one specific venue. */
export const asMarketLeg = asObject({
  venue: asString,
  market_id: asString,
  outcome_id: asOptional(asString),
  url: asOptional(asString),
  volume_24h: asOptional(asBiggystring),
  resolution_date: asOptional(asString)
})
export type MarketLeg = ReturnType<typeof asMarketLeg>

/**
 * One real-world event matched across venues (a "cluster"), with a leg per
 * venue and per-venue inside prices.
 */
export const asPredictionMarket = asObject({
  id: asString,
  title: asString,
  category: asOptional(asString),
  league: asOptional(asString),
  image: asOptional(asString),
  legs: asOptional(asArray(asMarketLeg), () => []),
  venue_prices: asOptional(asArray(asVenuePrice), () => []),
  book: asOptional(asMarketBook)
})
export type PredictionMarket = ReturnType<typeof asPredictionMarket>

export const asPredictionMarkets = asArray(asPredictionMarket)

/**
 * Formats a `0`-`1` decimal-string probability price as whole cents
 * (`'0.62'` becomes `'62¢'`). Missing prices render as `'-'`.
 */
export const formatCentsPrice = (price?: string): string => {
  if (price == null || price === '') return '-'
  return `${toFixed(mul(price, '100'), 0, 0)}¢`
}

/**
 * The market's best (lowest) ask: the merged book's `best_ask` when present,
 * falling back to the lowest per-venue best ask. Both scenes highlight the
 * best-priced venue with this value.
 */
export const getBestAskPrice = (
  market: PredictionMarket
): string | undefined => {
  if (market.book?.best_ask != null) return market.book.best_ask
  let best: string | undefined
  for (const venuePrice of market.venue_prices) {
    const ask = venuePrice.best_ask
    if (ask == null) continue
    if (best == null || lt(ask, best)) best = ask
  }
  return best
}

/** Hosts a market leg's `url` may open, matched with subdomains. */
const VENUE_LINK_HOSTS = ['polymarket.com', 'hyperliquid.xyz', 'kalshi.com']

/**
 * True only for https URLs on a known venue site. Live API responses are
 * untrusted: a scheme check alone still lets a hostile response point at
 * hosts the app claims as App Links (deep.edge.app and friends), which the
 * deep-link parser rewrites into in-app handlers, so venue links open only
 * on this allowlist.
 */
export const isSafeVenueUrl = (url: string): boolean => {
  if (!/^https:\/\//i.test(url)) return false
  const authority = url.replace(/^https:\/\//i, '').split(/[/?#]/)[0]
  // Userinfo makes everything before the "@" cosmetic
  // (https://polymarket.com:443@evil.example/ opens evil.example), and venue
  // URLs never carry credentials, so reject it outright:
  if (authority.includes('@')) return false
  const hostname = authority.split(':')[0].toLowerCase()
  return VENUE_LINK_HOSTS.some(
    allowedHost =>
      hostname === allowedHost || hostname.endsWith(`.${allowedHost}`)
  )
}
