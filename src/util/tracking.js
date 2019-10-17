// @flow

import DeviceInfo from 'react-native-device-info'
import firebase from 'react-native-firebase'

import ENV from '../../env.json'

type TrackingEvent =
  | 'CreateWalletAccountDone_EOS'
  | 'CreateWalletAccountSelect_EOS'
  | 'CreateWalletAccountSendBack_EOS'
  | 'CreateWalletAccountSetup_EOS'
  | 'EdgeProvider_Conversion_Success'
  | 'Exchange_Shift_Failed'
  | 'Exchange_Shift_Quote'
  | 'Exchange_Shift_Start'
  | 'Exchange_Shift_Success'
  | 'Signup_Wallets_Created'
  | 'Start_App'

type TrackingParams = {
  [key: string]: string
}

// Set up the global Firebase instance at boot:
if (ENV.USE_FIREBASE && !firebase.isMock) {
  firebase.analytics().setUserId(DeviceInfo.getUniqueID())
  global.firebase = firebase
}

/**
 * Tracks a user event, like navigating or logging in.
 */
export async function trackEvent (event: TrackingEvent | string, params?: TrackingParams) {
  if (global.firebase) {
    global.firebase.analytics().logEvent(event, params)
  }
}
