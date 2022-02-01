// @flow

import ENV from '../../env.json'

/**
 * Something got thrown, so turn that into a dev-friendly string.
 * @param {*} error Some value we got from `catch`
 * @returns A string with (hopefully) enough information to debug the issue.
 */
export function makeErrorLog(error: mixed): string {
  let message = String(error)
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
  return error instanceof Error ? error.message : String(error)
}
