import { sprintf } from 'sprintf-js'

import { lstrings } from '../locales/strings'

/**
 * Edge could not log the user's wallet in to a ramp provider. The message
 * names the cause for logs and error reports, while users see the
 * translated request to try again from translateRampLoginError.
 */
export class RampLoginError extends Error {
  /** The provider's display name, such as 'DFX' */
  readonly providerName: string
  /** Why the login failed, for logs */
  readonly reason: string

  constructor(providerName: string, reason: unknown) {
    super(`${providerName} login failed: ${String(reason)}`)
    this.name = 'RampLoginError'
    this.providerName = providerName
    this.reason = String(reason)
  }
}

export function translateRampLoginError(error: RampLoginError): string {
  return sprintf(
    lstrings.fiat_plugin_wallet_login_failed_1s,
    error.providerName
  )
}
