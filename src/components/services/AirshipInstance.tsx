import { addBreadcrumb } from '@sentry/react-native'
import * as React from 'react'
import { ActivityIndicator } from 'react-native'
import { makeAirship } from 'react-native-airship'
import { getVersion } from 'react-native-device-info'

import { trackError } from '../../util/tracking'
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
  const { trackError: doTrackError = true, tag } = options
  const tagMessage = tag == null ? '' : ` Tag: ${tag}.`
  const translatedMessage = translateError(error) + tagMessage
  if (doTrackError) {
    trackError(error)
  }
  console.log(redText('Showing error drop-down alert: ' + makeErrorLog(error)))

  if (translatedMessage.includes('edge-core: The WebView has been unmounted.')) return
  Airship.show(bridge => <AlertDropdown bridge={bridge} message={translatedMessage} />).catch(err => console.error(err))
}

/**
 * Only shows on develop builds and only logs to disk, not to bugsnag. Will not
 * show on staging or master. Dropdown does not auto-dismiss.
 *
 * Async for core errors only, so it can properly avoid spamming errors.
 */
export async function showDevErrorAsync(error: unknown, options: ShowErrorWarningOptions = {}): Promise<void> {
  const appVersion = getVersion()
  const { tag } = options
  const tagMessage = tag == null ? '' : ` Tag: ${tag}.`
  const translatedMessage = translateError(error) + tagMessage
  if (translatedMessage.includes('edge-core: The WebView has been unmounted.')) return

  console.error(redText('Showing DEV drop-down alert: ' + makeErrorLog(error)))

  if (__DEV__ || appVersion === '99.99.99' || appVersion.includes('-d')) {
    // Non-production (develop) builds show all errors
    await Airship.show(bridge => <AlertDropdown bridge={bridge} persistent message={translatedMessage} />)
  } else {
    // Production/staging builds don't show visible errors, but just saves a
    // breadcrumb.
    addBreadcrumb({
      type: 'DEV_ERROR',
      message: translatedMessage,
      timestamp: new Date().getTime() / 1000
    })
  }
}

/**
 * Only shows on develop builds and only logs to disk, not to bugsnag. Will not
 * show on staging or master. Dropdown does not auto-dismiss.
 */
export function showDevError(error: unknown, options: ShowErrorWarningOptions = {}): void {
  showDevErrorAsync(error, options).catch(err => console.error(err))
}

/**
 * Shows a warning to the user.
 * Used when some user-requested operation succeeds but with a warning.
 */
export function showWarning(error: unknown, options: ShowErrorWarningOptions = {}): void {
  const { trackError: doTrackError = true, tag } = options
  const translatedError = tag ? `Tag: ${tag}. ` + translateError(error) : translateError(error)
  if (doTrackError) {
    trackError(error, tag)
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
      () => setTimeout(() => bridge.resolve(), 0),
      () => setTimeout(() => bridge.resolve(), 0)
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
