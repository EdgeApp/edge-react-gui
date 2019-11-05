// @flow

import { type EdgeAccount } from 'edge-core-js/types'
import DeviceInfo from 'react-native-device-info'
import firebase from 'react-native-firebase'

import ENV from '../../env.json'
import { loadCreationReason } from './installReason.js'

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

export type TrackingValues = {
  accountDate?: string, // Account creation date
  currencyCode?: string, // Wallet currency code
  dollarValue?: number, // Conversion amount, in USD
  installerId?: string, // Account installerId
  pluginId?: string // Plugin that provided the conversion
}

// Set up the global Firebase instance at boot:
if (ENV.USE_FIREBASE && !firebase.isMock) {
  firebase.analytics().setUserId(DeviceInfo.getUniqueID())
  global.firebase = firebase
}

/**
 * Tracks a conversion, which involves some type of revenue.
 */
export async function trackConversion (
  event: TrackingEvent,
  opts: {
    account: EdgeAccount,
    currencyCode: string,
    exchangeAmount: number,
    pluginId: string
  }
) {
  const { account, currencyCode, exchangeAmount, pluginId } = opts

  // Look up the dollar value:
  const dollarValue: number = await account.exchangeCache.convertCurrency(currencyCode, 'iso:USD', exchangeAmount)

  // Record the event:
  const values: TrackingValues = {
    dollarValue,
    pluginId,
    ...(await loadCreationReason(account))
  }
  return logToFirebase(event, values)
}

/**
 * Tracks a user event, like navigating or logging in.
 */
export async function trackEvent (
  event: TrackingEvent,
  opts?: {
    account?: EdgeAccount,
    currencyCode?: string // For wallet creation events
  } = {}
) {
  const { account, currencyCode } = opts

  // Record the event:
  const values: TrackingValues = {
    currencyCode,
    ...(await loadCreationReason(account))
  }
  return logToFirebase(event, values)
}

/**
 * Send a raw event to Firebase.
 */
async function logToFirebase (event: TrackingEvent, values: TrackingValues) {
  const { accountDate, currencyCode, dollarValue, installerId, pluginId } = values

  if (!global.firebase) return

  // Adjust params:
  const params: Object = {}
  if (accountDate != null) params.adate = accountDate
  if (currencyCode != null) params.currency = currencyCode
  if (dollarValue != null) {
    params.currency = 'USD'
    params.value = Number(dollarValue.toFixed(2))
  }
  if (installerId != null) params.aid = installerId
  if (pluginId != null) params.plugin = pluginId
  global.firebase.analytics().logEvent(event, params)

  // If we get passed a dollarValue, translate the event into a purchase:
  if (dollarValue != null) {
    params.items = event
    global.firebase.analytics().logEvent('purchase', params)
    global.firebase.analytics().logEvent('ecommerce_purchase', params)
  }
}
