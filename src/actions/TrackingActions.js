// @flow

import { type CreationReason } from '../types/CreationReason.js'
import { type Dispatch, type GetState } from '../types/reduxTypes.js'
import { type TrackingEvent, type TrackingValues, logEvent } from '../util/tracking.js'

/**
 * Tracks a conversion, which involves some type of revenue.
 */
export const trackConversion = (
  event: TrackingEvent,
  opts: {
    currencyCode: string,
    exchangeAmount: number,
    pluginId: string
  }
) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { currencyCode, exchangeAmount, pluginId } = opts

  // Look up the dollar value:
  const { account } = state.core
  const dollarValue: number = await account.exchangeCache.convertCurrency(currencyCode, 'iso:USD', exchangeAmount)

  // Record the event:
  const { creationReason } = state.account
  return logEvent(event, {
    dollarValue,
    pluginId,
    ...makeTrackingValues(creationReason)
  })
}

/**
 * Tracks an event tied to a particular account's affiliate information,
 * such as creating the initial wallets.
 */
export const trackAccountEvent = (event: TrackingEvent, trackingValues: TrackingValues = {}) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()

  // Record the event:
  const { creationReason } = state.account
  return logEvent(event, {
    ...trackingValues,
    ...makeTrackingValues(creationReason)
  })
}

/**
 * Turn account affiliate information into clean tracking values.
 * Obfuscates the creation date so the server can't guess account identities.
 */
function makeTrackingValues (creationReason: CreationReason | null | void): TrackingValues {
  if (creationReason == null) return {}
  return {
    accountDate: creationReason.creationDate.toISOString().replace(/-\d\dT.*/, ''),
    installerId: creationReason.installerId
  }
}
