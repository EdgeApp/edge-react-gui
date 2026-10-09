/**
 * Fiat code shapes, Node-safe.
 *
 * `CurrencyWalletHelpers.ts` holds the GUI's copy of this and imports
 * Airship, so the CLI cannot reach it — which is why the extraction made a
 * second copy. One module both can import instead: the value feeds a
 * user-facing string (the fiat code inside an `Exchange:From %1$s`
 * subcategory), so two implementations is two places for it to drift.
 */
// From `fiatConstants`, where it is declared, not through `utils`, which
// only re-exports it: this module exists to be small and Node-safe, and
// reaching a 780-line module for one function is the dependency it was
// extracted to avoid.
import { removeIsoPrefix } from './fiatConstants'

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

/**
 * Accept a 3-letter ISO 4217 code (`USD`, `eur`) or `iso:USD`.
 *
 * Returns `iso:USD`, or undefined when the input is not a fiat code — which
 * is what `cleanFiatCurrencyCode` above does not do: it takes any string and
 * prefixes it. Here beside it rather than in `fillTxsFiat.ts`, a module
 * about pricing transactions, because this is the other half of one subject.
 */
export function toIsoFiatCode(raw: string): string | undefined {
  let code = raw.trim().toUpperCase()
  if (code.startsWith('ISO:')) code = code.slice(4)
  if (!/^[A-Z]{3}$/.test(code)) return undefined
  return `iso:${code}`
}
