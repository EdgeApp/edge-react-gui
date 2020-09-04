// @flow

import { type Dispatch, type GetState } from '../types/reduxTypes.js'
import { type AccountReferral } from '../types/ReferralTypes.js'
import { type TrackingEvent, type TrackingValues, logEvent } from '../util/tracking.js'

/**
 * Tracks a conversion, which involves some type of revenue.
 */
export const trackConversion = (
  event: TrackingEvent,
  opts: {
    currencyCode: string,
    exchangeAmount: number,
    pluginId: string,
    orderId?: string
  }
) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { currencyCode, exchangeAmount, pluginId, orderId } = opts

  // Look up the dollar value:
  const { account } = state.core
  const dollarValue: number = await account.exchangeCache.convertCurrency(currencyCode, 'iso:USD', exchangeAmount)

  // Record the event:
  const { accountReferral } = state.account
  return logEvent(event, {
    dollarValue,
    pluginId,
    orderId,
    ...makeTrackingValues(accountReferral)
  })
}

/**
 * Tracks an event tied to a particular account's affiliate information,
 * such as creating the initial wallets.
 */
export const trackAccountEvent = (event: TrackingEvent, trackingValues: TrackingValues = {}) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()

  // Record the event:
  const { accountReferral } = state.account
  return logEvent(event, {
    ...trackingValues,
    ...makeTrackingValues(accountReferral)
  })
}

/**
 * Turn account affiliate information into clean tracking values.
 * Obfuscates the creation date so the server can't guess account identities.
 */
function makeTrackingValues(accountReferral: AccountReferral): TrackingValues {
  const { creationDate, installerId } = accountReferral
  if (installerId == null || creationDate == null) return {}
  return {
    accountDate: creationDate.toISOString().replace(/-\d\dT.*/, ''),
    installerId
  }
}
