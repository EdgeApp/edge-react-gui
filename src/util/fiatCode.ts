/**
 * Fiat code shapes, Node-safe.
 *
 * `CurrencyWalletHelpers.ts` holds the GUI's copy of this and imports
 * Airship, so the CLI cannot reach it — which is why the extraction made a
 * second copy. One module both can import instead: the value feeds a
 * user-facing string (the fiat code inside an `Exchange:From %1$s`
 * subcategory), so two implementations is two places for it to drift.
 */
import { removeIsoPrefix } from './utils'

/**
 * Take any form of fiat currency code and return it both with and without
 * the `iso:` prefix.
 */
export function cleanFiatCurrencyCode(fiatCurrencyCode: string): {
  fiatCurrencyCode: string
  isoFiatCurrencyCode: string
} {
  if (fiatCurrencyCode.startsWith('iso:')) {
    return {
      fiatCurrencyCode: removeIsoPrefix(fiatCurrencyCode),
      isoFiatCurrencyCode: fiatCurrencyCode
    }
  }
  return { fiatCurrencyCode, isoFiatCurrencyCode: `iso:${fiatCurrencyCode}` }
}
