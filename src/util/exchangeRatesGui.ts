/**
 * GUI wiring for historical rates. Import once at app startup so
 * `exchangeRates.ts` reports queue errors via Airship.
 *
 * Call sites keep importing helpers from `./exchangeRates`.
 */
import { showError } from '../components/services/AirshipInstance'
import { configureExchangeRates } from './exchangeRates'

configureExchangeRates({
  // Wrapped, not passed bare: a bare reference makes `exchangeRates.ts`'s own
  // `onQueryError(error)` the reporting frame for every caller, so this file
  // — the one a reader would blame — appears nowhere in the stack.
  onError: (error: unknown) => {
    showError(error)
  }
})
