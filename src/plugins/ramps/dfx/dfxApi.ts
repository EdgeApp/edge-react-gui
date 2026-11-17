import { asMaybe } from 'cleaners'

import { RampIpCountryError } from '../../../types/RampIpCountryError'
import { asDfxErrorResponse } from './dfxRampTypes'

export const DFX_API_URL = 'https://api.dfx.swiss/v1'

// DFX refuses requests from blocked countries with a 403 whose message is
// "The country of IP address is not allowed":
const IP_COUNTRY_MESSAGE = /\bcountry of (the )?IP\b/i

/**
 * Fetches a DFX API path and returns the response text. Throws
 * RampIpCountryError when DFX blocks the country of the IP address, and an
 * error naming the path, status and DFX's answer for any other failure.
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
      `${path.split('?')[0]} returned ${response.status}: ${text}`
    )
  }
  return text
}

function isIpCountryBlock(text: string): boolean {
  const body = asMaybe(asDfxErrorResponse)(text)
  if (body == null) return false
  const messages =
    typeof body.message === 'string' ? [body.message] : body.message
  return messages.some(message => IP_COUNTRY_MESSAGE.test(message))
}
