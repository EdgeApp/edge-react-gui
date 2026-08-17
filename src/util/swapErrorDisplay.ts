import { captureException } from '@sentry/react-native'
import {
  asMaybeInsufficientFundsError,
  asMaybeSwapAboveLimitError,
  asMaybeSwapBelowLimitError,
  asMaybeSwapCurrencyError,
  asMaybeSwapPermissionError,
  type EdgeDenomination,
  type EdgeSwapRequest
} from 'edge-core-js'
import { sprintf } from 'sprintf-js'

import { lstrings } from '../locales/strings'
import { getCurrencyCode } from './CurrencyInfoHelpers'
import { convertNativeToDisplay, zeroString } from './utils'

/** A swap failure, phrased for the user. */
export interface SwapErrorDisplayInfo {
  message: string
  title: string
  error: unknown
}

interface ProcessSwapQuoteErrorOpts {
  error: unknown
  swapRequest: EdgeSwapRequest
  fromDenomination: EdgeDenomination
  toDenomination: EdgeDenomination
  /**
   * Destination currency code. A send-to-address request carries no
   * destination wallet to read one from, so the caller supplies it.
   */
  toCurrencyCode?: string
}

/**
 * Turn a failed swap quote into something worth showing a user: the provider's
 * own message, the limit that was crossed, or the specific reason the pair is
 * unavailable. Callers render the result rather than a catch-all string, so a
 * user who is 0.1 LTC under the floor is told the floor.
 */
export function processSwapQuoteError({
  error,
  swapRequest,
  fromDenomination,
  toDenomination,
  toCurrencyCode
}: ProcessSwapQuoteErrorOpts): SwapErrorDisplayInfo | undefined {
  // Basic sanity checks (should never fail):
  if (error == null) return

  // Some plugins get the insufficient funds error wrong:
  const errorMessage =
    error instanceof Error ? error.message : JSON.stringify(error)

  // Track swap errors to sentry:
  trackSwapError(error, swapRequest, toCurrencyCode)

  // Check for known error types:
  const insufficientFunds = asMaybeInsufficientFundsError(error)
  if (insufficientFunds != null || errorMessage === 'InsufficientFundsError') {
    return {
      title: lstrings.exchange_insufficient_funds_title,
      message: lstrings.exchange_insufficient_funds_message,
      error
    }
  }

  if (
    error instanceof Error &&
    error.message === 'Unexpected pending transactions'
  ) {
    return {
      title: lstrings.exchange_insufficient_funds_title,
      message: lstrings.exchange_pending_funds_error,
      error
    }
  }

  const aboveLimit = asMaybeSwapAboveLimitError(error)
  if (aboveLimit != null) {
    const currentCurrencyDenomination =
      aboveLimit.direction === 'to' ? toDenomination : fromDenomination

    const { nativeMax } = aboveLimit
    const nativeToDisplayRatio = currentCurrencyDenomination.multiplier
    const displayMax = convertNativeToDisplay(nativeToDisplayRatio)(nativeMax)

    return {
      title: lstrings.exchange_generic_error_title,
      message: !zeroString(displayMax)
        ? sprintf(
            lstrings.amount_above_limit,
            displayMax,
            currentCurrencyDenomination.name
          )
        : lstrings.no_amount_above_limit,
      error
    }
  }

  const belowLimit = asMaybeSwapBelowLimitError(error)
  if (belowLimit != null) {
    const currentCurrencyDenomination =
      belowLimit.direction === 'to' ? toDenomination : fromDenomination

    const { nativeMin } = belowLimit
    const nativeToDisplayRatio = currentCurrencyDenomination.multiplier
    const displayMin = convertNativeToDisplay(nativeToDisplayRatio)(nativeMin)

    return {
      title: lstrings.exchange_generic_error_title,
      message: !zeroString(displayMin)
        ? sprintf(
            lstrings.amount_below_limit,
            displayMin,
            currentCurrencyDenomination.name
          )
        : lstrings.no_amount_below_limit,
      error
    }
  }

  const currencyError = asMaybeSwapCurrencyError(error)
  if (currencyError != null) {
    const fromCurrencyCode = getCurrencyCode(
      swapRequest.fromWallet,
      swapRequest.fromTokenId
    )
    const toCode =
      toCurrencyCode ??
      getCurrencyCode(
        // Wallet-to-wallet swaps always have a destination wallet here; the
        // fallback only keeps the type honest for swap-to-address requests.
        swapRequest.toWallet ?? swapRequest.fromWallet,
        swapRequest.toTokenId
      )

    return {
      title: lstrings.exchange_generic_error_title,
      message: sprintf(lstrings.ss_unable, fromCurrencyCode, toCode),
      error
    }
  }

  const permissionError = asMaybeSwapPermissionError(error)
  if (permissionError?.reason === 'geoRestriction') {
    return {
      title: lstrings.exchange_generic_error_title,
      message: lstrings.ss_geolock,
      error
    }
  }

  // Anything else. The provider's own message beats a catch-all string, since
  // it is usually the only thing that says what actually went wrong:
  return {
    title: lstrings.exchange_generic_error_title,
    message: errorMessage,
    error
  }
}

/**
 * Reports a swap error to Sentry, with searchable tags for the swap request
 * according to Edge's company policy.
 */
function trackSwapError(
  error: unknown,
  swapRequest: EdgeSwapRequest,
  toCurrencyCode?: string
): void {
  // The destination, from whichever half of the request carries it. A
  // send-to-address request has no `toWallet` at all, and falling back to the
  // SOURCE wallet there tagged every stealth-send failure as if the swap had
  // ended on the chain it started on, which is exactly the pair-specific
  // triage these tags exist for. The descriptor names the destination chain,
  // and the caller supplies the payout currency code.
  const { toWallet, toAddressInfo } = swapRequest
  const toWalletKind =
    toWallet?.currencyInfo.pluginId ?? toAddressInfo?.toPluginId ?? 'unknown'
  const toCurrency =
    toWallet != null
      ? getCurrencyCode(toWallet, swapRequest.toTokenId)
      : toCurrencyCode ?? 'unknown'

  captureException(error, scope => {
    // This is a warning level error because it's expected to occur but not wanted.
    scope.setLevel('warning')
    // Searchable tags:
    scope.setTags({
      errorType: 'swapQuoteFailure',
      swapFromWalletKind: swapRequest.fromWallet.currencyInfo.pluginId,
      swapFromCurrency: getCurrencyCode(
        swapRequest.fromWallet,
        swapRequest.fromTokenId
      ),
      swapToCurrency: toCurrency,
      swapToWalletKind: toWalletKind,
      swapDirectionType: swapRequest.quoteFor
    })
    // Unsearchable context data:
    scope.setContext('Swap Request Details', {
      fromTokenId: String(swapRequest.fromTokenId), // Stringify to include "null"
      fromWalletType: swapRequest.fromWallet.type,
      toTokenId: String(swapRequest.toTokenId), // Stringify to include "null"
      // The destination's own wallet type, which a send-to-address request
      // does not have. Naming the destination chain there is the honest
      // answer; reading the SOURCE wallet claimed the swap ended where it
      // started.
      toWalletType: toWallet?.type ?? `address:${toWalletKind}`,
      quoteFor: swapRequest.quoteFor
    })
    return scope
  })
}
