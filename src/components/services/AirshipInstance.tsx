import Bugsnag from '@bugsnag/react-native'
import * as React from 'react'
import { ActivityIndicator } from 'react-native'
import { makeAirship } from 'react-native-airship'

import { makeErrorLog, translateError } from '../../util/translateError'
import { AirshipToast } from '../common/AirshipToast'
import { AlertDropdown } from '../navigation/AlertDropdown'
export const Airship = makeAirship()

export interface ShowErrorWarningOptions {
  // Report error to external bug tracking tool (ie. Bugsnag)
  trackError?: boolean
  tag?: string
}
/**
 * Shows an error to the user.
 * Used when some user-requested operation fails.
 */
export function showError(error: unknown, options: ShowErrorWarningOptions = {}): void {
  const { trackError = true, tag } = options
  const tagMessage = tag == null ? '' : `Tag: ${tag}. `
  const translatedMessage = tagMessage + translateError(error)
  if (trackError) {
    if (error instanceof Error) {
      // Log error with stack trace and a translated message to Bugsnag:
      error.message = translatedMessage
      Bugsnag.notify(error)
    } else {
      // Any other types we just send the translated message to Bugsnag:
      Bugsnag.notify(translatedMessage)
    }
  }
  console.log(redText('Showing error drop-down alert: ' + makeErrorLog(error)))
  Airship.show(bridge => <AlertDropdown bridge={bridge} message={translatedMessage} />).catch(err => console.error(err))
}

/**
 * Shows a warning to the user.
 * Used when some user-requested operation succeeds but with a warning.
 */
export function showWarning(error: unknown, options: ShowErrorWarningOptions = {}): void {
  const { trackError = true, tag } = options
  const translatedError = tag ? `Tag: ${tag}. ` + translateError(error) : translateError(error)
  if (trackError) {
    Bugsnag.notify(`showWarning: ${translatedError}`)
  }
  console.log(yellowText('Showing warning drop-down alert: ' + makeErrorLog(error)))
  Airship.show(bridge => <AlertDropdown bridge={bridge} message={translatedError} warning />).catch(err => console.error(err))
}

/**
 * Shows a message to the user.
 * Used when some user-requested operation succeeds.
 */
export function showToast(message: string, autoHideMs?: number): void {
  Airship.show(bridge => <AirshipToast bridge={bridge} autoHideMs={autoHideMs} message={message} />).catch(err => console.error(err))
}

/**
 * Shows a message to the user with spinner
 * Closes only once promise resolves or rejects
 */
export async function showToastSpinner<T>(message: string, activity: Promise<T>): Promise<T> {
  Airship.show(bridge => {
    activity.then(
      () => bridge.resolve(),
      () => bridge.resolve()
    )
    return (
      <AirshipToast bridge={bridge} message={message} autoHideMs={0}>
        <ActivityIndicator />
      </AirshipToast>
    )
  }).catch(err => console.error(err))
  return await activity
}

/**
 * Makes text red in dev mode.
 */
export function redText(message: string): string {
  // @ts-expect-error
  if (!global.__DEV__) return message
  return `\x1b[31m${message}\x1b[39m`
}

/**
 * Makes text yellow in dev mode.
 */
export function yellowText(message: string): string {
  // @ts-expect-error
  if (!global.__DEV__) return message
  return `\x1b[33m${message}\x1b[39m`
}
