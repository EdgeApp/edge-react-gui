// @flow

import { type Cleaner, asArray, asDate, asEither, asJSON, asNull, asNumber, asObject, asOptional, asString, asUnknown, uncleaner } from 'cleaners'

import { asBase64 } from '../../../util/cleaners/asBase64'
import { asBroadcastTx, asNewPushEvent, asPushEventState, asPushMessage, asPushTrigger } from './pushCleaners'
import { type NewPushEvent, type PushEvent } from './pushTypes'

// ---------------------------------------------------------------------------
// Request types
// ---------------------------------------------------------------------------

export type PushRequestBody = {
  // The request payload:
  data?: mixed,

  // Who is making the request:
  apiKey: string,
  deviceId: string,
  deviceToken?: string,

  // For logins:
  loginId?: Uint8Array
}

export type DeviceUpdatePayload = {
  loginIds: Uint8Array[],
  createEvents?: NewPushEvent[],
  removeEvents?: string[]
}

// ---------------------------------------------------------------------------
// Request cleaners
// ---------------------------------------------------------------------------

export const asPushRequestBody: Cleaner<PushRequestBody> = asObject({
  // The request payload:
  data: asUnknown,

  // Who is making the request:
  apiKey: asString,
  deviceId: asString,
  deviceToken: asOptional(asString),

  // For logins:
  loginId: asOptional(asBase64)
})

export const wasPushRequestBody = uncleaner(asJSON(asPushRequestBody))

/**
 * PUSH /v2/device/update payload.
 */
export const asDeviceUpdatePayload = asObject({
  loginIds: asArray(asBase64),
  createEvents: asOptional(asArray(asNewPushEvent), []),
  removeEvents: asOptional(asArray(asString), [])
})

/**
 * PUSH /v2/login/update payload.
 */

export const asLoginUpdatePayload = asObject({
  createEvents: asOptional(asArray(asNewPushEvent), []),
  removeEvents: asOptional(asArray(asString), [])
})
export type LoginUpdatePayload = $Call<typeof asLoginUpdatePayload>

export const wasLoginUpdatePayload = uncleaner(asLoginUpdatePayload)

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

/**
 * A push event returned from a query.
 */
export const asPushEventStatus: Cleaner<
  $Diff<
    PushEvent,
    {
      created: *,
      deviceId: *,
      loginId: *
    }
  >
> = asObject({
  eventId: asString,

  broadcastTxs: asOptional(asArray(asBroadcastTx)),
  pushMessage: asOptional(asPushMessage),
  trigger: asPushTrigger,

  // Status:
  broadcastTxErrors: asOptional(asArray(asEither(asString, asNull))),
  pushMessageEmits: asOptional(asNumber), // Number of devices we sent to
  pushMessageFails: asOptional(asNumber), // Number of devices that failed
  pushMessageError: asOptional(asString),
  state: asPushEventState,
  triggered: asOptional(asDate)
})

/**
 * POST /v2/device response payload.
 */
export const asDevicePayload = asObject({
  loginIds: asArray(asBase64),
  events: asArray(asPushEventStatus)
})

/**
 * POST /v2/login response payload.
 */
export const asLoginPayload = asObject({
  events: asArray(asPushEventStatus)
})

export const asErrorResponse = asJSON(
  asObject({
    error: asString
  })
)
