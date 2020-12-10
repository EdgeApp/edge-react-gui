// @flow

import * as React from 'react'
import { ActivityIndicator } from 'react-native'
import { makeAirship } from 'react-native-airship'

import { THEME } from '../../theme/variables/airbitz.js'
import { AirshipFullScreenSpinner } from '../common/AirshipFullScreenSpinner.js'
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
 * Shows a message & activity spinner on a fullscreen backdrop, tied to the lifetime of a promise.
 * No touches will be registed at it's lifetime.
 */
export function showFullScreenSpinner<T>(message: string, promise: Promise<T>): Promise<T> {
  Airship.show(bridge => <AirshipFullScreenSpinner bridge={bridge} message={message} activity={promise} />)
  return promise
}

/**
 * Shows an error alert to the user.
 * Used when some user-requested operation fails.
 */
export function showError(error: mixed): void {
  console.log(error)

  // TODO: Run the errors through our translation infrastructure:
  const message = error instanceof Error ? error.message : String(error)

  Airship.show(bridge => <AlertDropdown bridge={bridge} message={message} />)
}

/**
 * Shows an error warning to the user.
 * Used when some user-requested operation succeeds but with a warning.
 */
export function showWarning(message: string): void {
  Airship.show(bridge => <AlertDropdown bridge={bridge} message={message} warning />)
}

/**
 * Shows a message to the user.
 * Used when some user-requested operation succeeds.
 */
export function showToast(message: string): void {
  Airship.show(bridge => <AirshipToast bridge={bridge} message={message} />)
}
