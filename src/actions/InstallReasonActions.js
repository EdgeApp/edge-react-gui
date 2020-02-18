// @flow

import { packInstallReason, unpackInstallReason } from '../types/InstallReason.js'
import { type Dispatch, type GetState } from '../types/reduxTypes.js'
import { logEvent } from '../util/tracking.js'

const UTILITY_SERVER_FILE = 'utilityServer.json'

/**
 * Call this early in the app startup to see if we were installed
 * from an affiliate link or coin-specific link.
 */
export const loadInstallReason = () => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { context, disklet } = state.core

  // First try the disk:
  try {
    const text = await disklet.getText(UTILITY_SERVER_FILE)
    const installReason = unpackInstallReason(JSON.parse(text))
    dispatch({ type: 'INSTALL_REASON_LOADED', data: installReason })
    return
  } catch (error) {}

  // Do not affiliate this device if we have already logged in:
  if (context.localUsers.length > 0) return

  // Now try the network:
  try {
    console.log('Fetching app install reason')
    const reply = await fetch('https://util1.edge.app/ref')
    if (!reply.ok) {
      throw new Error(`Util server returned status code ${reply.status}`)
    }
    const installReason = unpackInstallReason(await reply.json())
    dispatch({ type: 'INSTALL_REASON_LOADED', data: installReason })
    await disklet.setText(UTILITY_SERVER_FILE, JSON.stringify(packInstallReason(installReason)))
  } catch (error) {
    // If all else fails, we just don't have a reason:
    console.log('Failed to load install reason', error)
    logEvent('LoadInstallReasonFail')
  }
}
