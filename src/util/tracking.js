// @flow

import { type Disklet } from 'disklet'
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
  accountDate?: string, // Account creation date
  currencyCode?: string, // Wallet currency code
  dollarValue?: number, // Conversion amount, in USD
  installerId?: string, // Account installerId
  pluginId?: string // Plugin that provided the conversion
}

/**
 * Why was this app installed on the phone?
 */
type InstallReason = {
  currencyCodes?: Array<string>,
  installerId?: string,
  swapPluginId?: string
}

/**
 * Why was this account created?
 */
type CreationReason = {
  creationDate: string,
  installerId?: string
}

const CREATION_REASON_FILE = 'CreationReason.json'
const UTILITY_SERVER_FILE = 'utilityServer.json'

// Install information powered by the util server:
let installReason: InstallReason = {}

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
    const { accountDate, currencyCode, dollarValue, installerId, pluginId } = opts

    const params: Object = {}
    if (accountDate != null) params.adate = accountDate
    if (currencyCode != null) params.currency = currencyCode
    if (dollarValue != null) {
      params.CURRENCY = 'USD'
      params.VALUE = Number(dollarValue.toFixed(2))
    }
    if (installerId != null) params.aid = installerId
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

  // Try grabbing the affiliate ID from the account, if there is one:
  const creationReason: CreationReason | void = await account.disklet
    .getText(CREATION_REASON_FILE)
    .then(text => JSON.parse(text))
    .catch(() => {})
  if (creationReason != null) {
    const { installerId, creationDate } = creationReason
    opts.accountDate = creationDate
    opts.installerId = installerId
  }

  // Record the event:
  return trackEvent(event, opts)
}

/**
 * Call this early in the app startup to see if we were installed
 * from an affiliate link or coin-specific link.
 */
export async function loadInstallReason (disklet: Disklet, isFreshInstall: boolean) {
  const json = await disklet
    .getText(UTILITY_SERVER_FILE)
    .then(json => JSON.parse(json))
    .catch(async () => {
      // Nothing is on disk, so try the server:
      const json = isFreshInstall ? await fetchInstallReason() : {}
      await disklet.setText(UTILITY_SERVER_FILE, JSON.stringify(json))
      return json
    })
    .catch(e => {
      // If all else fails, we just don't have a reason:
      console.log(e)
      return {}
    })

  installReason = cleanInstallReason(json)
}

/**
 * Sanitize raw install information, which may come from the disk or server.
 */
function cleanInstallReason (json: Object): InstallReason {
  const { currencyCode, currencyCodes, installerId, swapPluginId } = json

  const out: InstallReason = {}
  if (typeof currencyCode === 'string') {
    out.currencyCodes = [currencyCode.toUpperCase()]
  }
  if (Array.isArray(currencyCodes)) {
    out.currencyCodes = currencyCodes.filter(code => typeof code === 'string').map(code => code.toUpperCase())
  }
  if (typeof installerId === 'string') out.installerId = installerId
  if (typeof swapPluginId === 'string') out.swapPluginId = swapPluginId
  return out
}

/**
 * Grab install information from the server.
 */
async function fetchInstallReason () {
  const reply = await fetch('https://util1.edge.app/ref')
  if (!reply.ok) {
    throw new Error(`Util server returned status code ${reply.status}`)
  }
  return reply.json()
}

/**
 * Returns the currency code that was used to install this application,
 * if any.
 */
export function getInstallCurrencies (): Array<string> | void {
  return installReason.currencyCodes
}

/**
 * Call this on a new account to set up affiliate information (if any).
 */
export async function saveCreationReason (account: EdgeAccount) {
  const creationDate = new Date().toISOString().replace(/-\d\dT.*/, '')
  const reason: CreationReason = { creationDate }

  const { installerId } = installReason
  if (installerId != null) reason.installerId = installerId
  await account.disklet.setText(CREATION_REASON_FILE, JSON.stringify(reason))
}
