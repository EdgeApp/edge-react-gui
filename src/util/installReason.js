// @flow

import { type Disklet } from 'disklet'
import { type EdgeAccount } from 'edge-core-js/types'

import { type TrackingValues } from './tracking.js'

/**
 * Why was this app installed on the phone?
 * Stored on the device.
 */
type InstallReason = {
  currencyCodes?: Array<string>,
  installerId?: string,
  swapPluginId?: string
}

/**
 * Why was this account created?
 * Stored in the account.
 */
type CreationReason = {
  creationDate: string,
  installerId?: string
}

const CREATION_REASON_FILE = 'CreationReason.json'
const UTILITY_SERVER_FILE = 'utilityServer.json'

// Install information powered by the util server:
let installReason: InstallReason = {}

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
 * Load the affiliate information (if any) from the account.
 */
export async function loadCreationReason (account?: EdgeAccount): Promise<TrackingValues> {
  if (account == null) return {}

  const creationReason: CreationReason | void = await account.disklet
    .getText(CREATION_REASON_FILE)
    .then(text => JSON.parse(text))
    .catch(() => {})
  if (creationReason == null) return {}

  const { installerId, creationDate } = creationReason
  return { accountDate: creationDate, installerId }
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
