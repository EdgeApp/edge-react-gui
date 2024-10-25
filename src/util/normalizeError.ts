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
  if (Array.isArray(error)) {
    const normalizedErrors = error.map(normalizeError)
    const normalizedMessage = `[${normalizedErrors.map(e => e.message).join(', ')}]`
    return new AggregateErrorFix(normalizedErrors, normalizedMessage)
  }

  return new Error(`Unknown error: ${String(error)}`)
}

// This is a temporary patch for AggregateError until it is available in Hermes.
// FIX: Remove this in newer versions of hermes.
export class AggregateErrorFix extends Error {
  constructor(public errors: Error[], message?: string) {
    super(message)
    this.name = 'AggregateError'
  }
}
