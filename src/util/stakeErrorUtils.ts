import { asMaybeInsufficientFundsError } from 'edge-core-js'
import { sprintf } from 'sprintf-js'

import { lstrings } from '../locales/strings'
import type { ChangeQuoteRequest } from '../plugins/stake-plugins/types'

interface StakeErrorOptions {
  /** The change the user was attempting when the error was thrown. */
  action: ChangeQuoteRequest['action']
  /** Currency code of the wallet's native asset, which pays the network fee. */
  nativeCurrencyCode: string
}

/**
 * Pick a user-presentable message for an error thrown while fetching or
 * approving a stake change quote, so the on-scene error field can show the real
 * reason instead of a scary popup alert plus "unknown error occurred".
 *
 * Errors raised inside the edge-core-js plugin WebView reach the app as plain
 * `Error` objects: the yaob bridge rebuilds them and copies `name` across,
 * which leaves `instanceof InsufficientFundsError` false. Matching has to go
 * through the `asMaybe*Error` cleaners, which test `name`.
 */
export const getStakeErrorMessage = (
  err: unknown,
  opts: StakeErrorOptions
): string => {
  const { action, nativeCurrencyCode } = opts

  if (asMaybeInsufficientFundsError(err) != null) {
    // The unstake network fee is paid in the wallet's native asset, so tell the
    // user which balance they need instead of a bare "Insufficient Funds".
    return action === 'unstake'
      ? sprintf(
          lstrings.stake_error_insufficient_funds_unstake_s,
          nativeCurrencyCode
        )
      : lstrings.exchange_insufficient_funds_title
  }

  return err instanceof Error && err.message !== ''
    ? err.message
    : lstrings.unknown_error_occurred_fragment
}
