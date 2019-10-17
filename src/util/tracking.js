// @flow

import { type EdgeAccount } from 'edge-core-js/types'
import DeviceInfo from 'react-native-device-info'
import firebase from 'react-native-firebase'

import ENV from '../../env.json'

// Feel free to add new events at any time!
// This type is here so we know all the possible values:
type TrackingEvent =
  | 'Activate_Wallet_Cancel'
  | 'Activate_Wallet_Done'
  | 'Activate_Wallet_Select'
  | 'Activate_Wallet_Start'
  | 'EdgeProvider_Conversion_Success'
  | 'Exchange_Shift_Failed'
  | 'Exchange_Shift_Quote'
  | 'Exchange_Shift_Start'
  | 'Exchange_Shift_Success'
  | 'Signup_Wallets_Created'
  | 'Start_App'

// Feel free to add new parameters at any time!
// This type is here so we know all the possible values:
type TrackingOptions = {
  currencyCode?: string, // Wallet currency code
  dollarValue?: number, // Conversion amount, in USD
  pluginId?: string // Plugin that provided the conversion
}

// Set up the global Firebase instance at boot:
if (ENV.USE_FIREBASE && !firebase.isMock) {
  firebase.analytics().setUserId(DeviceInfo.getUniqueID())
  global.firebase = firebase
}

/**
 * Tracks a user event, like navigating or logging in.
 */
export async function trackEvent (event: TrackingEvent, opts?: TrackingOptions = {}) {
  if (global.firebase) {
    const { currencyCode, dollarValue, pluginId } = opts

    const params: Object = {}
    if (currencyCode != null) params.currency = currencyCode
    if (dollarValue != null) {
      params.CURRENCY = 'USD'
      params.VALUE = Number(dollarValue.toFixed(2))
    }
    if (pluginId != null) params.plugin = pluginId
    global.firebase.analytics().logEvent(event, params)
  }
}

/**
 * Tracks a conversion, which involves some type of revenue.
 */
export async function trackConversion (
  event: TrackingEvent,
  conversionOpts: {
    account: EdgeAccount,
    currencyCode: string,
    exchangeAmount: number,
    pluginId: string,
    otherParams?: TrackingOptions
  }
) {
  const { account, currencyCode, exchangeAmount, pluginId, otherParams = {} } = conversionOpts

  // Look up the dollar value:
  const dollarValue: number = await account.exchangeCache.convertCurrency(currencyCode, 'iso:USD', exchangeAmount)
  const opts: TrackingOptions = { pluginId, dollarValue, ...otherParams }

  // Record the event:
  return trackEvent(event, opts)
}
