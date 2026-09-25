import {
  asMaybeInsufficientFundsError,
  asMaybeNetworkError,
  asMaybeSwapAboveLimitError,
  asMaybeSwapAddressError,
  asMaybeSwapBelowLimitError,
  asMaybeSwapCurrencyError,
  asMaybeSwapPermissionError
} from 'edge-core-js'

/**
 * Coarse bucket for a failed swap approval, logged with
 * `Exchange_Shift_Failed` so failures can be broken down without parsing the
 * raw error string.
 */
export type SwapErrorCategory =
  | 'quote_closed'
  | 'quote_expired'
  | 'broadcast'
  | 'insufficient_funds'
  | 'provider_rejected'
  | 'unknown'

const closedProxyPattern = /closed proxy/i
const insufficientFundsPattern = /insufficient (funds|balance)|user balance/i
const quoteExpiredPattern = /quote\b.*\bexpired/i
const broadcastPattern =
  /broadcast|submit_raw_tx|sendrawtransaction|tx_blob|sendboc|blockhash|sequence too high/i

/**
 * Classify an error thrown by `EdgeSwapQuote.approve`.
 *
 * @param error The value caught from `approve`.
 * @param isQuoteExpired Whether the quote's expiration date had passed when
 * the approval failed. Used only when the error itself names no cause.
 */
export const getSwapErrorCategory = (
  error: unknown,
  isQuoteExpired: boolean = false
): SwapErrorCategory => {
  const message = error instanceof Error ? error.message : String(error)

  if (closedProxyPattern.test(message)) return 'quote_closed'
  if (
    asMaybeInsufficientFundsError(error) != null ||
    insufficientFundsPattern.test(message)
  ) {
    return 'insufficient_funds'
  }
  if (quoteExpiredPattern.test(message)) return 'quote_expired'
  if (
    asMaybeSwapAboveLimitError(error) != null ||
    asMaybeSwapBelowLimitError(error) != null ||
    asMaybeSwapCurrencyError(error) != null ||
    asMaybeSwapPermissionError(error) != null ||
    asMaybeSwapAddressError(error) != null
  ) {
    return 'provider_rejected'
  }
  if (asMaybeNetworkError(error) != null || broadcastPattern.test(message)) {
    return 'broadcast'
  }
  // A broadcast can outlast the quote, so expiry only explains an error
  // nothing more specific matched:
  if (isQuoteExpired) return 'quote_expired'
  return 'unknown'
}
