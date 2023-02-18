import analytics from '@react-native-firebase/analytics'
import { getUniqueId, getVersion } from 'react-native-device-info'

import { ENV } from '../env'
import { fetchReferral } from './network'

export type TrackingEventName =
  | 'Activate_Wallet_Cancel'
  | 'Activate_Wallet_Done'
  | 'Activate_Wallet_Select'
  | 'Activate_Wallet_Start'
  | 'Buy_Quote'
  | 'Buy_Quote_Change_Provider'
  | 'Buy_Quote_Next'
  | 'Create_Wallet_Failed'
  | 'Create_Wallet_From_Search_Failed'
  | 'Create_Wallet_From_Search_Success'
  | 'Create_Wallet_Success'
  | 'Earn_Spend_Launch'
  | 'EdgeProvider_Conversion_Success'
  | 'Exchange_Shift_Failed'
  | 'Exchange_Shift_Quote'
  | 'Exchange_Shift_Start'
  | 'Exchange_Shift_Success'
  | 'Load_Install_Reason_Match'
  | 'Load_Install_Reason_Fail'
  | 'Sell_Quote'
  | 'Sell_Quote_Change_Provider'
  | 'Sell_Quote_Next'
  | 'Signup_Wallets_Created_Failed'
  | 'Signup_Wallets_Created_Success'
  | 'Start_App'

export interface TrackingValues {
  accountDate?: string // Account creation date
  currencyCode?: string // Wallet currency code
  dollarValue?: number // Conversion amount, in USD
  installerId?: string // Account installerId, i.e. referralId
  pluginId?: string // Plugin that provided the conversion
  orderId?: string // Unique order identifier provided by plugin
  error?: string // Any error message string
}

// Set up the global Firebase instance at boot:
if (ENV.USE_FIREBASE) {
  const inner = analytics()
  inner.setUserId(getUniqueId())
  // @ts-expect-error
  global.firebase = {
    analytics() {
      return inner
    }
  }
}

/**
 * Send a raw event to all backends.
 */
export async function logEvent(event: TrackingEventName, values: TrackingValues = {}) {
  return Promise.all([logToFirebase(event, values), logToUtilServer(event, values)]).catch(error => console.warn(error))
}

/**
 * Send a raw event to Firebase.
 */
async function logToFirebase(name: TrackingEventName, values: TrackingValues) {
  const { accountDate, currencyCode, dollarValue, installerId, pluginId, error } = values

  // @ts-expect-error
  if (!global.firebase) return

  // Adjust params:
  const params: any = { edgeVersion: getVersion() }
  if (accountDate != null) params.adate = accountDate
  if (currencyCode != null) params.currency = currencyCode
  if (dollarValue != null) {
    params.currency = 'USD'
    params.value = Number(dollarValue.toFixed(2))
  }
  if (installerId != null) params.aid = installerId
  if (pluginId != null) params.plugin = pluginId
  if (error != null) params.error = error
  // @ts-expect-error
  global.firebase.analytics().logEvent(name, params)

  // If we get passed a dollarValue, translate the event into a purchase:
  if (dollarValue != null) {
    params.items = [name]
    // @ts-expect-error
    global.firebase.analytics().logEvent('purchase', params)
  }
}

/**
 * Send a tracking event to the util server.
 */
async function logToUtilServer(event: TrackingEventName, values: TrackingValues) {
  fetchReferral(`api/v1/event`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({ ...values, event })
  })
}
