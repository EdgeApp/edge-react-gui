import { asMaybe } from 'cleaners'

import { RampIpCountryError } from '../../../types/RampIpCountryError'
import { asDfxErrorResponse } from './dfxRampTypes'

export const DFX_API_URL = 'https://api.dfx.swiss/v1'

// DFX refuses requests from blocked countries with a 403 whose message is
// "The country of IP address is not allowed":
const IP_COUNTRY_MESSAGE = /\bcountry of (the )?IP\b/i

// Errors reach logs and error reports, so they carry at most this much of
// DFX's own message:
const MAX_ERROR_MESSAGE_LENGTH = 200

/**
 * Fetches a DFX API path and returns the response text. Throws
 * RampIpCountryError when DFX blocks the country of the IP address, and an
 * error naming the path, status and DFX's own message for any other
 * failure.
 */
export async function fetchDfx(
  path: string,
  init?: RequestInit
): Promise<string> {
  const response = await fetch(`${DFX_API_URL}${path}`, init)
  const text = await response.text()
  if (!response.ok) {
    if (response.status === 403 && isIpCountryBlock(text)) {
      throw new RampIpCountryError('DFX', text)
    }
    throw new Error(
      `${path.split('?')[0]} returned ${response.status}${describeError(text)}`
    )
  }
  return text
}

/**
 * DFX's own message from an error response, fit for logs and error
 * reports: capped, and without query strings, since DFX's 404 echoes the
 * request URL and a query can hold the user's address. Any other body,
 * such as a proxy's HTML page, is left out.
 */
function describeError(text: string): string {
  const messages = getErrorMessages(text)
  if (messages.length === 0) return ''
  const message = messages
    .join('; ')
    .replace(/\?[^\s"']*/g, '?…')
    .slice(0, MAX_ERROR_MESSAGE_LENGTH)
  return `: ${message}`
}

function getErrorMessages(text: string): string[] {
  const body = asMaybe(asDfxErrorResponse)(text)
  if (body == null) return []
  return typeof body.message === 'string' ? [body.message] : body.message
}

function isIpCountryBlock(text: string): boolean {
  return getErrorMessages(text).some(message =>
    IP_COUNTRY_MESSAGE.test(message)
  )
}
