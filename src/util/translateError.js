// @flow

import { type Cleaner, asEither, asMaybe, asObject, asString } from 'cleaners'

import ENV from '../../env.json'
import { BitPayError, translateBitPayError } from '../types/BitPayError'
import { ResolutionError, translateResolutionError } from '../types/ResolutionError'

function asProperty<T>(key: string, asT: Cleaner<T>): Cleaner<T> {
  return v => {
    return asObject({ [key]: asT })(v)[key]
  }
}
function asJsonString(v) {
  try {
    if (typeof v === 'string') return JSON.stringify(JSON.parse(v))
    return JSON.stringify(v)
  } catch (err) {
    const message = asMaybe(asErrorMessage)(err) ?? '<unreadible error message>'
    throw new TypeError(`Expected stringifiable JSON: ${message}`)
  }
}
const asErrorMessage = asEither(asProperty('message', asString), asString, asJsonString)

/**
 * Something got thrown, so turn that into a dev-friendly string.
 * @param {*} error Some value we got from `catch`
 * @returns A string with (hopefully) enough information to debug the issue.
 */
export function makeErrorLog(error: mixed): string {
  let message = asErrorMessage(error)
  if (ENV.DEBUG_CORE || ENV.DEBUG_PLUGINS || ENV.DEBUG_VERBOSE_ERRORS) {
    if (error instanceof Error) message += `\n${error.stack}`
    message += `\n${JSON.stringify(error, null, 2)}`
  }
  return message
}

/**
 * Something got thrown, so turn that into a human-friendly string.
 * @param {*} error Some value we got from `catch`
 * @returns A translated, human-friendly string (in many cases).
 */
export function translateError(error: mixed): string {
  // GUI Error types:
  if (error instanceof BitPayError) return translateBitPayError(error)
  if (error instanceof ResolutionError) return translateResolutionError(error)

  const message = asErrorMessage(error)

  return message
}
