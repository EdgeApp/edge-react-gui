// @flow

import React from 'react'
import { makeAirship } from 'react-native-airship'

import { AirshipToast } from '../common/AirshipToast.js'
import { AlertDropdown } from '../navigation/AlertDropdown.js'

export const Airship = makeAirship()

/**
 * Shows a message & activity spinner tied to the lifetime of a promise.
 */
export function showActivity<T> (message: string, promise: Promise<T>): Promise<T> {
  Airship.show(bridge => <AirshipToast bridge={bridge} message={message} activity={promise} />)
  return promise
}

/**
 * Shows an error alert to the user.
 * Used when some user-requested operation fails.
 */
export function showError (error: mixed) {
  console.log(error)

  // TODO: Run the errors through our translation infrastructure:
  const message = error instanceof Error ? error.message : String(error)

  return Airship.show(bridge => <AlertDropdown bridge={bridge} message={message} />)
}

/**
 * Shows a message to the user.
 * Used when some user-requested operation succeeds.
 */
export function showToast (message: string) {
  return Airship.show(bridge => <AirshipToast bridge={bridge} message={message} />)
}
