import { asString } from 'cleaners'

/**
 * Accepts strings that are valid numbers according to biggystring.
 *
 * Valid strings contain some digits,
 * with an optional decimal point plus some more digits. That is all.
 *
 * We reject blank strings, hex strings, exponential strings ("1e10"),
 * "Infinity", "NaN", and other similar invalid inputs.
 */
export function asBiggystring(raw: unknown): string {
  const clean = asString(raw)
  if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(clean)) return clean

  throw new TypeError(`"${clean}" is not a valid number`)
}
