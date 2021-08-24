// @flow

import * as React from 'react'
import { ActivityIndicator } from 'react-native'
import { makeAirship } from 'react-native-airship'

import { THEME } from '../../theme/variables/airbitz.js'
import { AirshipToast, toastUnit } from '../common/AirshipToast.js'
import { AlertDropdown } from '../navigation/AlertDropdown.js'

export const Airship = makeAirship()

/**
 * Shows a message & activity spinner tied to the lifetime of a promise.
 */
export function showActivity<T>(message: string, promise: Promise<T>): Promise<T> {
  Airship.show(bridge => {
    // Hide the toast when the activity completes:
    promise.then(
      () => bridge.resolve(),
      () => bridge.resolve()
    )
    return (
      <AirshipToast bridge={bridge} message={message}>
        <ActivityIndicator color={THEME.COLORS.BLACK} style={{ marginLeft: toastUnit }} />
      </AirshipToast>
    )
  })
  return promise
}

/**
 * Shows an error alert to the user.
 * Used when some user-requested operation fails.
 */
export function showError(error: mixed): void {
  console.error('Showing error drop-down alert:', error)

  // TODO: Run the errors through our translation infrastructure:
  const message = error instanceof Error ? error.message : String(error)

  Airship.show(bridge => <AlertDropdown bridge={bridge} message={message} />)
}

/**
 * Shows an error warning to the user.
 * Used when some user-requested operation succeeds but with a warning.
 */
export function showWarning(error: mixed): void {
  console.error('Showing warning drop-down alert:', error)

  // TODO: Run the errors through our translation infrastructure:
  const message = error instanceof Error ? error.message : String(error)

  Airship.show(bridge => <AlertDropdown bridge={bridge} message={message} warning />)
}

/**
 * Shows a message to the user.
 * Used when some user-requested operation succeeds.
 */
export function showToast(message: string): void {
  Airship.show(bridge => <AirshipToast bridge={bridge} message={message} />)
}
