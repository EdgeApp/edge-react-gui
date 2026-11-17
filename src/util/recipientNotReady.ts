import { asObject, asString, asValue } from 'cleaners'
import { sprintf } from 'sprintf-js'

import { I18nError } from '../components/cards/ErrorCard'
import { lstrings } from '../locales/strings'

/**
 * An engine refused a spend because the recipient can't receive the asset
 * yet: an account that isn't activated, a token the recipient hasn't added,
 * or an issuer that hasn't authorized them.
 */
const asRecipientNotReadyError = asObject({
  name: asValue('RecipientNotReadyError'),
  reason: asString,
  currencyCode: asString,
  message: asString
})

/**
 * Turns an engine's recipient refusal into a localized error the send scene
 * can show, naming what the recipient has to do. Returns undefined for any
 * other error.
 */
export function describeRecipientNotReady(
  error: unknown,
  chainName: string
): I18nError | undefined {
  let refusal: ReturnType<typeof asRecipientNotReadyError>
  try {
    refusal = asRecipientNotReadyError(error)
  } catch (cleanerError: unknown) {
    return undefined
  }

  const { currencyCode, reason } = refusal
  const message =
    reason === 'accountNotActivated'
      ? sprintf(
          lstrings.send_recipient_account_not_activated_2s,
          chainName,
          currencyCode
        )
      : reason === 'tokenNotAdded'
      ? sprintf(
          lstrings.send_recipient_token_not_added_2s,
          currencyCode,
          chainName
        )
      : reason === 'notAuthorized'
      ? sprintf(lstrings.send_recipient_not_authorized_1s, currencyCode)
      : refusal.message
  return new I18nError(lstrings.transaction_failure, message)
}
