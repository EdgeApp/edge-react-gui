// @flow

import * as React from 'react'
import { makeAirship } from 'react-native-airship'

import ENV from '../../../env.json'
import { AirshipToast } from '../common/AirshipToast.js'
import { AlertDropdown } from '../navigation/AlertDropdown.js'
export const Airship = makeAirship()

/**
 * Shows an error to the user.
 * Used when some user-requested operation fails.
 */
export function showError(error: mixed): void {
  showAlert(error, false)
}

/**
 * Shows a warning to the user.
 * Used when some user-requested operation succeeds but with a warning.
 */
export function showWarning(error: mixed): void {
  showAlert(error, true)
}

/**
 * Shows an error or warning to the user.
 * Used when some user-requested operation succeeds but with a warning.
 */
function showAlert(error: mixed, isWarning: boolean): void {
  // WIP: Run the errors through our translation infrastructure:
  if (ENV.DEBUG_VERBOSE_ERRORS) {
    // Show extended warning data
    const logColoredText = isWarning ? '\x1b[34m\x1b[43mWarning:' : '\x1b[37m\x1b[41mError:'
    console.log(logColoredText + `\n${JSON.stringify(error, null, 2)}` + '\x1b[0m')
  }

  // Short short warning data in the GUI
  const message = error instanceof Error ? error.message : String(error)
  Airship.show(bridge => <AlertDropdown bridge={bridge} message={message} warning={isWarning} />)
}

/**
 * Shows a message to the user.
 * Used when some user-requested operation succeeds.
 */
export function showToast(message: string): void {
  Airship.show(bridge => <AirshipToast bridge={bridge} message={message} />)
}
