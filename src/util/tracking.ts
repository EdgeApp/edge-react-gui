import Bugsnag from '@bugsnag/react-native'
import analytics from '@react-native-firebase/analytics'
import { TrackingEventName as LoginTrackingEventName, TrackingValues as LoginTrackingValues } from 'edge-login-ui-rn'
import PostHog from 'posthog-react-native'
import { getBuildNumber, getUniqueId, getVersion } from 'react-native-device-info'
import { checkNotifications } from 'react-native-permissions'

import { getFirstOpenInfo } from '../actions/FirstOpenActions'
import { ENV } from '../env'
import { ExperimentConfig, getExperimentConfig } from '../experimentConfig'
import { ThunkAction } from '../types/reduxTypes'
import { CryptoAmount } from './CryptoAmount'
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
  | 'Fio_Domain_Register'
  | 'Fio_Domain_Renew'
  | 'Fio_Handle_Register'
  | 'Fio_Handle_Bundled_Tx'
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
  | 'Earn_Spend_Launch' // No longer used
  | LoginTrackingEventName

export type OnLogEvent = (event: TrackingEventName, values?: TrackingValues) => void

/**
 * Analytics: Known dollar amount revenue
 */
export interface DollarConversionValues {
  conversionType: 'dollar'
  dollarConversionValue: number
}

/**
 * Analytics: Some unknown revenue based on a send (e.g. FIO handle/domain fees)
 * or swap
 */
export interface CryptoConversionValues {
  conversionType: 'crypto'
  cryptoAmount: CryptoAmount

  swapProviderId?: string
  orderId?: string
}

/**
 * Analytics: Sell to fiat
 */
export interface SellConversionValues {
  conversionType: 'sell'

  // The quoted fiat amounts resulting from this sale
  destFiatAmount: string
  destFiatCurrencyCode: string

  sourceAmount: CryptoAmount

  fiatProviderId: string // Fiat provider that provided the conversion
  orderId?: string // Unique order identifier provided by fiat provider
}

/**
 * Culmination of defined tracking value types, including those defined in
 * LoginUi.
 */
export interface TrackingValues extends LoginTrackingValues {
  error?: unknown | string // Any error

  createdWalletCurrencyCode?: string
  numSelectedWallets?: number // Number of wallets to be created
  numAccounts?: number // Number of full accounts saved on the device

  // Conversion values
  conversionValues?: DollarConversionValues | CryptoConversionValues | SellConversionValues
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
export function logEvent(event: TrackingEventName, values: TrackingValues = {}): ThunkAction<void> {
  return async (dispatch, getState) => {
    const { error, conversionValues, createdWalletCurrencyCode } = values
    getExperimentConfig()
      .then(async (experimentConfig: ExperimentConfig) => {
        // Persistent & Unchanged params:
        const { isFirstOpen, deviceId, firstOpenEpoch } = await getFirstOpenInfo()

        const params: any = { edgeVersion: getVersion(), buildNumber: getBuildNumber(), isFirstOpen, deviceId, firstOpenEpoch, ...values }

        // Populate referral params:
        const state = getState()
        const { accountReferral } = state.account
        params.refDeviceInstallerId = state.deviceReferral.installerId
        params.refDeviceCurrencyCodes = state.deviceReferral.currencyCodes

        const { creationDate, installerId } = accountReferral
        params.refAccountDate = installerId == null || creationDate == null ? undefined : creationDate.toISOString().replace(/-\d\dT.*/, '')
        params.refAccountInstallerId = accountReferral.installerId
        params.refAccountCurrencyCodes = accountReferral.currencyCodes

        // Adjust params:
        if (createdWalletCurrencyCode != null) params.currency = createdWalletCurrencyCode
        if (error != null) params.error = makeErrorLog(error)

        // Conversion values:
        if (conversionValues != null) {
          const { conversionType } = conversionValues
          if (conversionType === 'dollar') {
            params.currency = 'USD'
            params.dollarConverisonValue = Number(conversionValues.dollarConversionValue.toFixed(2))
          } else if (conversionType === 'sell') {
            const { sourceAmount, destFiatAmount, destFiatCurrencyCode, orderId, fiatProviderId } = conversionValues

            params.sourceDollarValue = Number(sourceAmount.displayDollarValue(state))
            params.sourceCryptoAmount = Number(sourceAmount.exchangeAmount)
            params.sourceCurrencyCode = sourceAmount.currencyCode

            params.destFiatValue = Number(destFiatAmount).toFixed(2)
            params.destFiatCurrencyCode = destFiatCurrencyCode

            if (orderId != null) params.orderId = orderId
            if (fiatProviderId != null) params.fiatProviderId = fiatProviderId
          } else if (conversionType === 'crypto') {
            const { cryptoAmount, swapProviderId, orderId } = conversionValues

            params.cryptoAmount = Number(cryptoAmount.exchangeAmount)
            params.currency = cryptoAmount.currencyCode

            params.dollarValue = Number(cryptoAmount.displayDollarValue(state))

            if (orderId != null) params.orderId = orderId
            if (swapProviderId != null) params.swapProviderId = swapProviderId
          }
        }

        // Add all 'sticky' remote config variant values:
        for (const key of Object.keys(experimentConfig)) params[`svar_${key}`] = experimentConfig[key as keyof ExperimentConfig]

        // Notifications
        const notificationPermission = await checkNotifications()
        params.notificationStatus = notificationPermission.status

        consify({ logEvent: { event, params } })

        Promise.all([logToPosthog(event, params), logToFirebase(event, params), logToUtilServer(event, params)]).catch(error => console.warn(error))
      })
      .catch(console.error)
  }
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
