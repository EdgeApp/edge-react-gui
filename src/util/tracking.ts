import Bugsnag from '@bugsnag/react-native'
import analytics from '@react-native-firebase/analytics'
import { TrackingEventName as LoginTrackingEventName, TrackingValues as LoginTrackingValues } from 'edge-login-ui-rn/lib/util/analytics'
import PostHog from 'posthog-react-native'
import { getUniqueId, getVersion } from 'react-native-device-info'

import { getFirstOpenInfo } from '../actions/FirstOpenActions'
import { ENV } from '../env'
import { ExperimentConfig, getExperimentConfig } from '../experimentConfig'
import { fetchReferral } from './network'
import { makeErrorLog } from './translateError'
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
  | 'Sell_Success'
  | 'Signup_Welcome'
  | 'Welcome_Signin'
  | 'Signup_Wallets_Created_Failed'
  | 'Signup_Wallets_Created_Success'
  | 'Signup_Wallets_Selected_Next'
  | 'Signup_Complete'
  | 'Start_App'
  | 'Start_App_No_Accounts'
  | 'Start_App_With_Accounts'
  | 'purchase'
  | 'Visa_Card_Launch'
  // No longer used:
  | 'Earn_Spend_Launch'
  | LoginTrackingEventName

export interface TrackingValues extends LoginTrackingValues {
  accountDate?: string // Account creation date
  currencyCode?: string // Wallet currency code
  dollarValue?: number // Conversion amount, in USD
  error?: unknown | string // Any error
  installerId?: string // Account installerId, i.e. referralId
  orderId?: string // Unique order identifier provided by plugin
  pluginId?: string // Plugin that provided the conversion
  numSelectedWallets?: number // Number of wallets to be created
  destCurrencyCode?: string
  destExchangeAmount?: string
  destPluginId?: string // currency pluginId of source asset
  sourceCurrencyCode?: string
  sourceExchangeAmount?: string
  sourcePluginId?: string // currency pluginId of dest asset
  numAccounts?: number // Number of full accounts saved on the device
}

// Set up the global Firebase analytics instance at boot:
if (ENV.USE_FIREBASE) {
  const inner = analytics()
  const setUserIdAsync = async () => {
    const uniqueId = await getUniqueId()
    await inner.setUserId(uniqueId)
  }
  setUserIdAsync().catch(e => console.error(e))

  // @ts-expect-error
  global.firebase = {
    analytics() {
      return inner
    }
  }
}
// Set up the global Posthog analytics instance at boot
if (ENV.POSTHOG_INIT) {
  const { apiKey, apiHost } = ENV.POSTHOG_INIT

  const posthogAsync: Promise<PostHog> = PostHog.initAsync(apiKey, {
    host: apiHost
  })

  posthogAsync
    .then(client => {
      // @ts-expect-error
      global.posthog = client
    })
    .catch(e => console.error(e))
}

/**
 * Track error to external reporting service (ie. Bugsnag)
 */
export function trackError(
  error: unknown,
  tag?: string,
  metadata?: {
    [key: string]: any
  }
): void {
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
  const { accountDate, currencyCode, dollarValue, installerId, pluginId, error } = values
  getExperimentConfig()
    .then(async (experimentConfig: ExperimentConfig) => {
      // Persistent & Unchanged params:
      const { isFirstOpen, deviceId, firstOpenEpoch } = await getFirstOpenInfo()
      const params: any = { edgeVersion: getVersion(), isFirstOpen, deviceId, firstOpenEpoch, ...values }

      // Adjust params:
      if (accountDate != null) params.adate = accountDate
      if (currencyCode != null) params.currency = currencyCode
      if (dollarValue != null) {
        params.currency = 'USD'
        params.value = Number(dollarValue.toFixed(2))
        params.items = [String(event)]
      }
      if (installerId != null) params.aid = installerId
      if (pluginId != null) params.plugin = pluginId
      if (error != null) params.error = makeErrorLog(error)

      // Add all 'sticky' remote config variant values:
      for (const key of Object.keys(experimentConfig)) params[`svar_${key}`] = experimentConfig[key as keyof ExperimentConfig]

      // TEMP HACK: Add renamed var for legacyLanding
      params.svar_newLegacyLanding = experimentConfig.legacyLanding

      consify({ logEvent: { event, params } })

      Promise.all([logToPosthog(event, params), logToFirebase(event, params), logToUtilServer(event, params)]).catch(error => console.warn(error))
    })
    .catch(console.error)
}

/**
 * Send a raw event to Firebase.
 */
async function logToFirebase(name: TrackingEventName, params: any) {
  // @ts-expect-error
  if (!global.firebase) return

  // If we get passed a dollarValue, translate the event into a purchase:
  if (params.dollarValue != null) {
    // @ts-expect-error
    global.firebase.analytics().logEvent('purchase', params)
  } else {
    // @ts-expect-error
    global.firebase.analytics().logEvent(name, params)
  }
}

/**
 * Send a raw event to Posthog
 */
async function logToPosthog(event: TrackingEventName, values: TrackingValues) {
  // @ts-expect-error
  if (!global.posthog) return

  // @ts-expect-error
  global.posthog.capture(event, values)
}

/**
 * Send a tracking event to the util server.
 */
async function logToUtilServer(event: TrackingEventName, values: TrackingValues) {
  await fetchReferral(`api/v1/event`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({ ...values, event })
  })
}
