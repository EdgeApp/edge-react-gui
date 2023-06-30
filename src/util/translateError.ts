import { asEither, asObject, asString } from 'cleaners'

import { ENV } from '../env'
import { PaymentProtoError, translatePaymentProtoError } from '../types/PaymentProtoError'
import { ResolutionError, translateResolutionError } from '../types/ResolutionError'

const asErrorMessage = asEither(
  asString,
  (raw: unknown) => asObject({ message: asString })(raw).message,
  (raw: unknown) => `Unrecognized exception: ${String(raw)}`
)

/**
 * Something got thrown, so turn that into a dev-friendly string.
 * @param {*} error Some value we got from `catch`
 * @returns A string with (hopefully) enough information to debug the issue.
 */
export function makeErrorLog(error: unknown): string {
  let message = asErrorMessage(error)
  if (ENV.DEBUG_CORE || ENV.DEBUG_PLUGINS || ENV.DEBUG_VERBOSE_ERRORS) {
    if (error instanceof Error) message += `\n${error.stack}`
    message += `\n${JSON.stringify(error, null, 2)}`
  }
  return message
}

/**
 * Something got thrown, so turn that into a human-friendly message string.
 * @param {*} error Some value we got from `catch`
 * @returns A translated, human-friendly string (in many cases).
 */
export function translateError(error: unknown): string {
  // GUI Error types:
  if (error instanceof PaymentProtoError) return translatePaymentProtoError(error)
  if (error instanceof ResolutionError) return translateResolutionError(error)

  return asErrorMessage(error)
}
