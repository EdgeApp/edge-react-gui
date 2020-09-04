// @flow

import { getUniqueId } from 'react-native-device-info'
import firebase from 'react-native-firebase'

import ENV from '../../env.json'
import { asyncWaterfall } from './utils.js'
export type TrackingEvent =
  | 'ActivateWalletCancel'
  | 'ActivateWalletSelect'
  | 'ActivateWalletStart'
  | 'ActivateWalletSuccess'
  | 'EdgeProviderConversion'
  | 'SwapFailed'
  | 'SwapQuote'
  | 'SwapStart'
  | 'SwapSuccess'
  | 'SignupWalletsCreated'
  | 'AppStart'
  | 'LoadDeviceReferralFail'

export type TrackingValues = {
  accountDate?: string, // Account creation date
  currencyCode?: string, // Wallet currency code
  dollarValue?: number, // Conversion amount, in USD
  installerId?: string, // Account installerId
  pluginId?: string, // Plugin that provided the conversion
  orderId?: string // Unique order identifier provided by plugin
}

// Set up the global Firebase instance at boot:
if (ENV.USE_FIREBASE && !firebase.isMock) {
  firebase.analytics().setUserId(getUniqueId())
  global.firebase = firebase
}

/**
 * Send a raw event to all backends.
 */
export async function logEvent(event: TrackingEvent, values: TrackingValues = {}) {
  return Promise.all([logToFirebase(event, values), logToUtilServer(event, values)]).catch(error => console.warn(error))
}

/**
 * Send a raw event to Firebase.
 */
async function logToFirebase(event: TrackingEvent, values: TrackingValues) {
  const { accountDate, currencyCode, dollarValue, installerId, pluginId } = values

  if (!global.firebase) return

  // Adjust event name:
  const names = {
    ActivateWalletCancel: 'Activate_Wallet_Cancel',
    ActivateWalletSelect: 'Activate_Wallet_Select',
    ActivateWalletStart: 'Activate_Wallet_Start',
    ActivateWalletSuccess: 'Activate_Wallet_Done',
    EdgeProviderConversion: 'EdgeProvider_Conversion_Success',
    SwapFailed: 'Exchange_Shift_Failed',
    SwapQuote: 'Exchange_Shift_Quote',
    SwapStart: 'Exchange_Shift_Start',
    SwapSuccess: 'Exchange_Shift_Success',
    SignupWalletsCreated: 'Signup_Wallets_Created',
    AppStart: 'Start_App',
    LoadDeviceReferralFail: 'Load_Install_Reason_Fail'
  }
  const name = names[event]
  if (!name) return

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
  global.firebase.analytics().logEvent(name, params)

  // If we get passed a dollarValue, translate the event into a purchase:
  if (dollarValue != null) {
    params.items = name
    global.firebase.analytics().logEvent('purchase', params)
    global.firebase.analytics().logEvent('ecommerce_purchase', params)
  }
}

/**
 * Send a tracking event to the util server.
 */
async function logToUtilServer(event: TrackingEvent, values: TrackingValues) {
  fetch('https://util2.edge.app/api/v1/event', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({ ...values, event })
  })
}

export async function utilWaterfall(path: string, options?: any): Promise<any> {
  const utilServers = ['https://util2.edge.app/', 'https://util1.edge.app/']
  const funcs = utilServers.map(server => async () => {
    const result = await fetch(server + path, options)
    if (typeof result !== 'object') {
      const msg = `Invalid return value ${path} in ${server}`
      console.log(msg)
      throw new Error(msg)
    }
    return result
  })
  return asyncWaterfall(funcs)
}
