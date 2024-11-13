import { asEither, asMaybe, asObject, asString, asValue, Cleaner } from 'cleaners'

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

/**
 * Interprets a token location as a contract address.
 * In the future this scene may need to handle other weird networks
 * where the networkLocation has other contents.
 */
export const asMaybeContractLocation = asMaybe(
  asObject({
    contractAddress: asString
  })
)

export const asObjectIn = <K extends string | number | symbol, T>(asKey: Cleaner<K>, asT: Cleaner<T>): Cleaner<{ [k in K]: T }> => {
  return function asObject(raw) {
    if (typeof raw !== 'object' || raw == null) {
      throw new TypeError('Expected an object, got ' + showValue(raw))
    }

    const out: any = {}
    const keys = Object.keys(raw)
    for (let i = 0; i < keys.length; ++i) {
      try {
        const key = asKey(keys[i])
        if (key === '__proto__') continue
        out[key] = asT(raw[key])
      } catch (error) {
        throw locateError(error, '[' + JSON.stringify(keys[i]) + ']', 0)
      }
    }
    return out
  }
}

export const asObjectInOrTrue = <K extends string | number | symbol, T>(asKey: Cleaner<K>, asT: Cleaner<T>) =>
  asEither(asObjectIn(asKey, asT), asValue<[true]>(true))

// -----------------------------------------------------------------------------
// Internal functions taken from `cleaners` package
// -----------------------------------------------------------------------------

/**
 * Given a JS value, produce a descriptive string.
 */
function showValue(value: any): string {
  switch (typeof value) {
    case 'function':
    case 'object':
      if (value == null) return 'null'
      if (Array.isArray(value)) return 'array'
      return typeof value

    case 'string':
      return JSON.stringify(value)

    default:
      return String(value)
  }
}

/**
 * Adds location information to an error message.
 *
 * Errors can occur inside deeply-nested cleaners,
 * such as "TypeError: Expected a string at .array[0].some.property".
 * To build this information, each cleaner along the path
 * should add its own location information as the stack unwinds.
 *
 * If the error has a `insertStepAt` property, that is the character offset
 * where the next step will go in the error message. Otherwise,
 * the next step just goes on the end of the string with the word "at".
 */
function locateError(error: unknown, step: string, offset: number): unknown {
  if (error instanceof Error) {
    // @ts-expect-error
    if (error.insertStepAt == null) {
      error.message += ' at '
      // @ts-expect-error
      error.insertStepAt = error.message.length
    }
    // @ts-expect-error
    error.message = error.message.slice(0, error.insertStepAt) + step + error.message.slice(error.insertStepAt)
    // @ts-expect-error
    error.insertStepAt += offset
  }
  return error
}
