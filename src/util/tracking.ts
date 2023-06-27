import Bugsnag from '@bugsnag/react-native'
import analytics from '@react-native-firebase/analytics'
import { getUniqueId, getVersion } from 'react-native-device-info'

import { ENV } from '../env'
import { fetchReferral } from './network'
import { consify } from './utils'

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
  | 'Signup_Welcome'
  | 'Signup_Wallets_Created_Failed'
  | 'Signup_Wallets_Created_Success'
  | 'Start_App'
  | 'purchase'
  | 'Visa_Card_Launch'
  // No longer used:
  | 'Earn_Spend_Launch'

export interface TrackingValues {
  // For new features initially deployed with vanilla A/B testing, 'A' denotes
  // the new feature was enabled for the event reported.
  // This prop can also arbitrarily be named depending on the context of the
  // event, i.e.: 'Plan A' | 'Experiment B' | 'Mod C' | 'Something Else'
  variantId?: string
  variantParams?: { [key: string]: string | number } // Any additional params to report

  accountDate?: string // Account creation date
  currencyCode?: string // Wallet currency code
  dollarValue?: number // Conversion amount, in USD
  error?: string // Any error message string
  installerId?: string // Account installerId, i.e. referralId
  orderId?: string // Unique order identifier provided by plugin
  pluginId?: string // Plugin that provided the conversion
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
 * Track error to external reporting service (ie. Bugsnag)
 */

export async function trackError(
  error: unknown,
  tag?: string,
  metadata?: {
    [key: string]: any
  }
): Promise<void> {
  let err: Error | string
  if (error instanceof Error || typeof error === 'string') {
    err = error
  } else {
    // At least send an error which should give us the callstack
    err = 'Unknown error occurred'
  }

  if (tag == null) {
    Bugsnag.notify(err)
  } else {
    Bugsnag.notify(err, report => {
      report.addMetadata(tag, metadata ?? {})
    })
  }
}

/**
 * Send a raw event to all backends.
 */
export function logEvent(event: TrackingEventName, values: TrackingValues = {}) {
  consify({ logEvent: { event, values } })
  Promise.all([logToFirebase(event, values), logToUtilServer(event, values)]).catch(error => console.warn(error))
}

/**
 * Send a raw event to Firebase.
 */
async function logToFirebase(name: TrackingEventName, values: TrackingValues) {
  const { accountDate, currencyCode, dollarValue, installerId, pluginId, error, variantId, variantParams } = values

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

  if (variantId != null) params.variant = variantId
  if (variantParams != null) {
    for (const variantParamKey of Object.keys(variantParams)) {
      params[`${variantId}_${variantParamKey}`] = variantParams[variantParamKey]
    }
  }

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
