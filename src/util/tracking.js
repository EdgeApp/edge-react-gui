// @flow

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
  currencyCode?: string // Wallet currency code
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
    const { currencyCode } = opts

    const params: Object = {}
    if (currencyCode != null) params.currency = currencyCode
    global.firebase.analytics().logEvent(event, params)
  }
}
