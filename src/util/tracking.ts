import { captureException, withScope } from '@sentry/react-native'
import { TrackingEventName as LoginTrackingEventName, TrackingValues as LoginTrackingValues } from 'edge-login-ui-rn'
import PostHog from 'posthog-react-native'
import { getBuildNumber, getVersion } from 'react-native-device-info'
import { checkNotifications } from 'react-native-permissions'

import { getFirstOpenInfo } from '../actions/FirstOpenActions'
import { ENV } from '../env'
import { ExperimentConfig, getExperimentConfig } from '../experimentConfig'
import { ThunkAction } from '../types/reduxTypes'
import { addMetadataToContext } from './addMetadataToContext'
import { CryptoAmount } from './CryptoAmount'
import { fetchReferral } from './network'
import { AggregateErrorFix, normalizeError } from './normalizeError'
import { makeErrorLog } from './translateError'
import { consify, monthsBetween } from './utils'

export type TrackingEventName =
  | 'Activate_Wallet_Cancel'
  | 'Activate_Wallet_Done'
  | 'Activate_Wallet_Select'
  | 'Activate_Wallet_Start'
  | 'Buy_Quote'
  | 'Buy_Quote_Change_Provider'
  | 'Buy_Quote_Next'
  | 'Buy_Success'
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
  | 'Survey_Discover'
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
  dollarRevenue: number
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
 * Analytics: Buy from fiat
 */
export interface BuyConversionValues {
  conversionType: 'buy'

  // The quoted fiat amounts resulting from this sale
  sourceFiatAmount: string
  sourceFiatCurrencyCode: string

  destAmount: CryptoAmount

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
  surveyResponse?: string // User's answer to a survey

  // Conversion values
  conversionValues?: DollarConversionValues | CryptoConversionValues | SellConversionValues | BuyConversionValues
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
 * Track error to external reporting service (ie. Sentry).
 *
 * It will take an exception of `unknown` type and normalize it into an error
 * for reporting.
 *
 * All normalization rules should be isolated to `normalizeError` utility.
 */
export function trackError(
  error: unknown,
  nameTag?: string,
  metadata?: {
    [key: string]: any
  }
): void {
  const err = normalizeError(error)

  if (err instanceof AggregateErrorFix) {
    // Track each error individually using a common group tag:
    const aggregateId = Date.now().toString(16)
    withScope(scope => {
      scope.setTag('aggregate.id', aggregateId)
      err.errors.forEach(e => trackError(e, nameTag, metadata))
    })
    return
  }

  captureException(err, scope => {
    scope.setTag('event.name', nameTag)
    if (metadata) {
      const context: Record<string, unknown> = {}
      addMetadataToContext(context, metadata)
      scope.setContext('Metadata', context)
    }
    return scope
  })
}

/**
 * Send a raw event to all backends.
 */
export function logEvent(event: TrackingEventName, values: TrackingValues = {}): ThunkAction<void> {
  return async (dispatch, getState) => {
    getExperimentConfig()
      .then(async (experimentConfig: ExperimentConfig) => {
        // Persistent & Unchanged params:
        const { isFirstOpen, deviceId, firstOpenEpoch } = await getFirstOpenInfo()

        const { error, createdWalletCurrencyCode, conversionValues, ...restValue } = values
        const params: any = { edgeVersion: getVersion(), buildNumber: getBuildNumber(), isFirstOpen, deviceId, firstOpenEpoch, ...restValue }

        // Populate referral params:
        const state = getState()
        const { exchangeRates, account, deviceReferral, core } = state
        const { accountReferral } = account
        params.refDeviceInstallerId = deviceReferral.installerId
        params.refDeviceCurrencyCodes = deviceReferral.currencyCodes

        const { creationDate, installerId } = accountReferral
        params.refAccountDate = installerId == null || creationDate == null ? undefined : creationDate.toISOString().replace(/-\d\dT.*/, '')
        params.refAccountInstallerId = accountReferral.installerId
        params.refAccountCurrencyCodes = accountReferral.currencyCodes

        // Get the account age in months:
        const { created: accountCreatedDate } = core.account
        params.accountAgeMonths = accountCreatedDate == null ? undefined : monthsBetween(accountCreatedDate, new Date())

        // Adjust params:
        if (createdWalletCurrencyCode != null) params.currency = createdWalletCurrencyCode
        if (error != null) params.error = makeErrorLog(error)

        // Conversion values:
        if (conversionValues != null) {
          const { conversionType } = conversionValues
          if (conversionType === 'dollar') {
            params.currency = 'USD'
            params.dollarRevenue = Math.abs(Number(conversionValues.dollarRevenue.toFixed(2)))
          } else if (conversionType === 'buy') {
            const { destAmount, sourceFiatAmount, sourceFiatCurrencyCode, orderId, fiatProviderId } = conversionValues

            params.destDollarValue = Math.abs(Number(destAmount.displayDollarValue(exchangeRates)))
            params.destCryptoAmount = Math.abs(Number(destAmount.exchangeAmount))
            params.destCurrencyCode = destAmount.currencyCode
            params.dollarValue = params.destDollarValue

            params.sourceFiatValue = Math.abs(Number(sourceFiatAmount)).toFixed(2)
            params.sourceFiatCurrencyCode = sourceFiatCurrencyCode

            if (orderId != null) params.orderId = orderId
            if (fiatProviderId != null) params.fiatProviderId = fiatProviderId
          } else if (conversionType === 'sell') {
            const { sourceAmount, destFiatAmount, destFiatCurrencyCode, orderId, fiatProviderId } = conversionValues

            params.sourceDollarValue = Math.abs(Number(sourceAmount.displayDollarValue(exchangeRates)))
            params.sourceCryptoAmount = Math.abs(Number(sourceAmount.exchangeAmount))
            params.sourceCurrencyCode = sourceAmount.currencyCode
            params.dollarValue = params.sourceDollarValue

            params.destFiatValue = Math.abs(Number(destFiatAmount)).toFixed(2)
            params.destFiatCurrencyCode = destFiatCurrencyCode

            if (orderId != null) params.orderId = orderId
            if (fiatProviderId != null) params.fiatProviderId = fiatProviderId
          } else if (conversionType === 'crypto') {
            const { cryptoAmount, swapProviderId, orderId } = conversionValues

            params.cryptoAmount = Math.abs(Number(cryptoAmount.exchangeAmount))
            params.currency = cryptoAmount.currencyCode

            params.dollarValue = Math.abs(Number(cryptoAmount.displayDollarValue(exchangeRates)))

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

        Promise.all([logToPosthog(event, params), logToUtilServer(event, params)]).catch(error => console.warn(error))
      })
      .catch(console.error)
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
  const body = JSON.stringify({ ...values, event })

  try {
    const response = await fetchReferral(`api/v1/event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body
    })
    if (!response.ok) {
      const text = await response.text()
      console.warn(`logToUtilServer:fetch ${event} ${text} body length: ${body.length}`)
      captureException(new Error(`logToUtilServer:fetch !ok ${event} ${text}`), { event_id: 'logToUtilServer', data: body })
    }
  } catch (e) {
    console.warn(`logToUtilServer:fetch ${event}`)
    console.warn(e)
    captureException(e, { event_id: 'logToUtilServer', data: body })
  }
}
