import { asArray, asObject, asOptional, asString } from 'cleaners'

import { ThunkAction } from '../types/reduxTypes'
import { DeviceReferral } from '../types/ReferralTypes'
import { asCurrencyCode, asMessageTweak, asPluginTweak } from '../types/TweakTypes'
import { fetchReferral } from '../util/network'
import { logEvent } from '../util/tracking'

const DEVICE_REFERRAL_FILE = 'utilityServer.json'

/**
 * Call this early in the app startup to see if we were installed
 * from an affiliate link or coin-specific link.
 */
export function loadDeviceReferral(): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState()
    const { context, disklet } = state.core

    // First try the disk:
    try {
      const text = await disklet.getText(DEVICE_REFERRAL_FILE)
      const deviceReferral = unpackDeviceReferral(JSON.parse(text))
      dispatch({ type: 'DEVICE_REFERRAL_LOADED', data: deviceReferral })
      return
    } catch (error: any) {}

    // Do not affiliate this device if we have already logged in:
    if (context.localUsers.length > 0) return

    // Now try the network:
    try {
      console.log('Fetching app install reason')
      const reply = await fetchReferral('ref')
      if (!reply.ok) {
        throw new Error(`Util server returned status code ${reply.status}`)
      }
      const deviceReferral = unpackDeviceReferral(await reply.json())
      dispatch({ type: 'DEVICE_REFERRAL_LOADED', data: deviceReferral })
      await disklet.setText(DEVICE_REFERRAL_FILE, JSON.stringify(deviceReferral))
    } catch (error: any) {
      // If all else fails, we just don't have a reason:
      console.log('Failed to load install reason', error)
      logEvent('Load_Install_Reason_Fail', { error: String(error) })
    }
  }
}

/**
 * Turns the on-disk data into an DeviceReferral structure.
 */
function unpackDeviceReferral(raw: any): DeviceReferral {
  const clean = asDiskDeviceReferral(raw)
  const out: DeviceReferral = {
    installerId: clean.installerId,
    currencyCodes: clean.currencyCodes,
    messages: clean.messages,
    plugins: clean.plugins
  }

  // Upgrade legacy fields:
  if (out.currencyCodes == null && clean.currencyCode != null) {
    out.currencyCodes = [clean.currencyCode]
  }
  return out
}

/**
 * Why was this app installed on the phone?
 * As it exists on disk, and also as sent from the util server.
 */
const asDiskDeviceReferral = asObject({
  installerId: asOptional(asString),
  currencyCodes: asOptional(asArray(asCurrencyCode)),
  messages: asOptional(asArray(asMessageTweak), () => []),
  plugins: asOptional(asArray(asPluginTweak), () => []),

  // Legacy fields:
  currencyCode: asOptional(asString)
})
