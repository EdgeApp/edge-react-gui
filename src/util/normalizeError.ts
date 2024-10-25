/**
 * Normalizes exceptions through into error instances. It will return all
 * instances which extend Error untouched, but convert other types into Error
 * instances.
 *
 * @param error some unknown caught exception
 * @returns An instance of Error or subclass of Error
 */
export function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error
  }
  if (typeof error === 'string') {
    return new Error(error)
  }
  return new Error(`Unknown error: ${String(error)}`)
}
