/**
 * GUI wiring for historical rates. Import once at app startup so
 * `exchangeRates.ts` reports queue errors via Airship.
 *
 * Call sites keep importing helpers from `./exchangeRates`.
 */
import { showError } from '../components/services/AirshipInstance'
import { configureExchangeRates } from './exchangeRates'

configureExchangeRates({
  onError: showError
})
