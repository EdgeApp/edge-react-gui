import { asObject, asString } from 'cleaners'

import { fetchInfo } from '../../../util/network'

const asMoonpaySignResponse = asObject({ signedUrl: asString })

/**
 * Ask the info server to bind a Moonpay widget URL to the caller's public IP
 * and sign it. Moonpay's on-ramp security upgrade refuses to load widget URLs
 * that are not signed and IP-bound, so every buy/sell widget URL must be routed
 * through here before it is opened.
 */
export const signMoonpayUrl = async (url: string): Promise<string> => {
  const response = await fetchInfo(
    'v1/moonpay/signUrl',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    },
    10000
  )
  if (!response.ok) {
    throw new Error(`Moonpay URL signing failed: ${response.status}`)
  }
  const reply = await response.json()
  return asMoonpaySignResponse(reply).signedUrl
}
