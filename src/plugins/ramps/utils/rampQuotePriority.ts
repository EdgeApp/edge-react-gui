import { eq } from 'biggystring'

import type { FiatPaymentType } from '../../gui/fiatPluginTypes'
import type { RampQuote } from '../rampPluginTypes'

/**
 * Ordering preferences applied on top of the normal best-rate sort.
 *
 * The preferences only float matching quotes up; they never remove a quote. A
 * preference that matches nothing (a provider that returned no quotes, or a
 * payment type the info server currently disables) leaves the ordering exactly
 * as it would have been without it.
 */
export interface RampQuotePriority {
  /** Ramp plugin ids to float to the top, highest priority first. */
  preferPluginIds?: string[]
  /** Payment type to float to the top. */
  preferPaymentType?: FiatPaymentType
}

const NO_PRIORITY: RampQuotePriority = {}

/**
 * Rank a quote against the priority, lowest first. The payment type outranks
 * the provider so that a link pinning both (`edge://buy/moonpay/venmo`) puts
 * the Venmo group first and MoonPay first within it.
 */
const getPriorityRank = (
  quote: RampQuote,
  priority: RampQuotePriority
): [number, number] => {
  const { preferPluginIds = [], preferPaymentType } = priority

  const paymentRank =
    preferPaymentType != null && quote.paymentType === preferPaymentType ? 0 : 1

  const pluginIndex = preferPluginIds.indexOf(quote.pluginId)
  const pluginRank = pluginIndex === -1 ? preferPluginIds.length : pluginIndex

  return [paymentRank, pluginRank]
}

/**
 * Compare two quotes for display order: preferred quotes first, then quotes
 * that actually have amounts, then by best rate for the direction.
 *
 * The priority ranks sit ABOVE the has-amounts tier on purpose. A pin or an
 * affiliate preference is an intentional promotion, so it wins outright even
 * for an external provider whose quotes are always amount-less placeholders
 * (`createExternalRampPlugin` emits `'0'` amounts with a
 * `specialQuoteRateMessage`): `edge://buy/libertyx` must visibly surface
 * LibertyX at the top, "Tap to view quote amount and rate" face and all.
 * Without a priority in play, quotes with amounts still outrank placeholders.
 */
export const compareRampQuotes =
  (
    direction: 'buy' | 'sell',
    priority: RampQuotePriority = NO_PRIORITY
  ): ((a: RampQuote, b: RampQuote) => number) =>
  (a, b) => {
    const [paymentRankA, pluginRankA] = getPriorityRank(a, priority)
    const [paymentRankB, pluginRankB] = getPriorityRank(b, priority)
    if (paymentRankA !== paymentRankB) return paymentRankA - paymentRankB
    if (pluginRankA !== pluginRankB) return pluginRankA - pluginRankB

    const hasAmountA = rampQuoteHasAmounts(a)
    const hasAmountB = rampQuoteHasAmounts(b)
    if (hasAmountA && !hasAmountB) return -1
    if (!hasAmountA && hasAmountB) return 1
    if (!hasAmountA && !hasAmountB) return 0

    const cryptoAmountA = parseFloat(a.cryptoAmount)
    const cryptoAmountB = parseFloat(b.cryptoAmount)

    // Guard against division by zero
    if (cryptoAmountA === 0 || cryptoAmountB === 0) {
      if (cryptoAmountA === 0 && cryptoAmountB === 0) return 0
      if (cryptoAmountA === 0) return 1
      return -1
    }

    const rateA = parseFloat(a.fiatAmount) / cryptoAmountA
    const rateB = parseFloat(b.fiatAmount) / cryptoAmountB
    return direction === 'sell' ? rateB - rateA : rateA - rateB
  }

export const rampQuoteHasAmounts = (quote: RampQuote): boolean =>
  !eq(quote.fiatAmount, '0') || !eq(quote.cryptoAmount, '0')

/**
 * The quote with the best rate, ignoring any priority. Anything that makes a
 * claim about the rate itself (the create scene's exchange rate, the select
 * scene's "Best Rate" badge) must use this rather than the first prioritized
 * quote, which is whichever one the link or the affiliate config floated up.
 */
export const getBestRateRampQuote = (
  quotes: RampQuote[],
  direction: 'buy' | 'sell'
): RampQuote | undefined => {
  if (quotes.length === 0) return undefined
  return [...quotes].sort(compareRampQuotes(direction))[0]
}

/**
 * Describe the parts of the priority that matched no quote, so the caller can
 * log the graceful fallback. Returns an empty array when everything matched (or
 * when there was nothing to match).
 */
export const getUnmatchedRampQuotePriority = (
  quotes: RampQuote[],
  priority: RampQuotePriority = NO_PRIORITY
): string[] => {
  const { preferPluginIds = [], preferPaymentType } = priority

  const unmatched: string[] = []
  for (const pluginId of preferPluginIds) {
    if (!quotes.some(quote => quote.pluginId === pluginId)) {
      unmatched.push(`provider '${pluginId}'`)
    }
  }
  if (
    preferPaymentType != null &&
    !quotes.some(quote => quote.paymentType === preferPaymentType)
  ) {
    unmatched.push(`payment type '${preferPaymentType}'`)
  }
  return unmatched
}
