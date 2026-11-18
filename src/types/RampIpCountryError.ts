import { sprintf } from 'sprintf-js'

import { lstrings } from '../locales/strings'

/**
 * A ramp provider refused the user because of the country of their IP
 * address, whatever region they chose in Edge. Opening the provider anyway
 * only lands the user on its own login, which fails the same way.
 */
export class RampIpCountryError extends Error {
  /** The provider's display name, such as 'DFX' */
  readonly providerName: string
  /** The provider's response, for logs */
  readonly serverMessage: string

  constructor(providerName: string, serverMessage: string) {
    super(
      `${providerName} blocks the country of the IP address: ${serverMessage}`
    )
    this.name = 'RampIpCountryError'
    this.providerName = providerName
    this.serverMessage = serverMessage
  }
}

export function translateRampIpCountryError(error: RampIpCountryError): string {
  return sprintf(
    lstrings.ramp_provider_ip_country_blocked_1s,
    error.providerName
  )
}
