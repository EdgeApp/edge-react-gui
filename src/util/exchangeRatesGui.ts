/**
 * GUI wiring for historical rates. Import once at app startup so
 * `exchangeRates.ts` reports queue errors via Airship.
 *
 * Call sites keep importing helpers from `./exchangeRates`.
 */
import { showError, showWarning } from '../components/services/AirshipInstance'
import { configureExchangeRates } from './exchangeRates'

/**
 * How long the same pass failure stays suppressed.
 *
 * `TransactionListRow` calls `useHistoricalRate` once per visible row, so
 * during a rates-server outage scrolling a wallet's list is one failure after
 * another about the same thing — and a 1,200-transaction unpriced export is
 * thirteen passes. One drop-down tells the user what they need to know;
 * thirteen is the outage reported as a user error.
 */
const PASS_WARNING_QUIET_MS = 30_000
let lastPassWarningAt = 0

configureExchangeRates({
  // Wrapped, not passed bare: a bare reference makes `exchangeRates.ts`'s own
  // `onQueryError(error)` the reporting frame for every caller, so this file
  // — the one a reader would blame — appears nowhere in the stack.
  onError: (error: unknown) => {
    showError(error)
  },
  // One pass of a retried queue, which is a warning rather than an error:
  // the chain goes on, and at `origin/develop` this arm was a `console.warn`
  // that reached neither Airship nor Sentry. `trackError: false` keeps it
  // out of Sentry, where an outage was arriving as one event per failed
  // pass per user.
  onPassError: (error: unknown) => {
    const now = Date.now()
    if (now - lastPassWarningAt < PASS_WARNING_QUIET_MS) return
    lastPassWarningAt = now
    showWarning(error, { trackError: false })
  }
})
