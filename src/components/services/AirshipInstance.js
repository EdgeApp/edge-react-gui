// @flow

import * as React from 'react'
import { makeAirship } from 'react-native-airship'

import { makeErrorLog, translateError } from '../../util/translateError'
import { AirshipToast } from '../common/AirshipToast.js'
import { AlertDropdown } from '../navigation/AlertDropdown.js'
export const Airship = makeAirship()

/**
 * Shows an error to the user.
 * Used when some user-requested operation fails.
 */
export function showError(error: mixed): void {
  console.log(redText('Showing error drop-down alert: ' + makeErrorLog(error)))
  Airship.show(bridge => <AlertDropdown bridge={bridge} message={translateError(error)} />)
}

/**
 * Shows a warning to the user.
 * Used when some user-requested operation succeeds but with a warning.
 */
export function showWarning(error: mixed): void {
  console.log(yellowText('Showing warning drop-down alert: ' + makeErrorLog(error)))
  Airship.show(bridge => <AlertDropdown bridge={bridge} message={translateError(error)} warning />)
}

/**
 * Shows a message to the user.
 * Used when some user-requested operation succeeds.
 */
export function showToast(message: string): void {
  Airship.show(bridge => <AirshipToast bridge={bridge} message={message} />)
}

/**
 * Makes text red in dev mode.
 */
export function redText(message: string): string {
  if (!global.__DEV__) return message
  return `\x1b[31m${message}\x1b[39m`
}

/**
 * Makes text yellow in dev mode.
 */
export function yellowText(message: string): string {
  if (!global.__DEV__) return message
  return `\x1b[33m${message}\x1b[39m`
}
