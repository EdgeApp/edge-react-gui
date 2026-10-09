import type { EdgeAccount } from 'edge-core-js'
import React from 'react'
import { makeEvent } from 'yavent'

import { showToast } from '../components/services/AirshipInstance'
import { lstrings } from '../locales/strings'
import { useSelector } from '../types/reactRedux'
import type { ThunkAction } from '../types/reduxTypes'
import {
  asLocalAccountSettings,
  asNotifInfo,
  type LocalAccountSettings,
  type NotifInfo,
  type PasswordReminder,
  type SpendingLimits
} from '../types/types'
import { errorMessage } from '../util/errorMessage'
import {
  LOCAL_SETTINGS_FILENAME,
  readLocalAccountSettingsForWrite,
  readLocalAccountSettingsOrDefaults,
  writeLocalAccountSettingsToDisk
} from '../util/localAccountSettings'
import { logActivity } from '../util/logger'

export { LOCAL_SETTINGS_FILENAME }

// Long enough to read the instructions in the balance-hidden toast:
const TOAST_HIDE_MS = 5000

let localAccountSettings: LocalAccountSettings = asLocalAccountSettings({})
const [watchAccountSettings, emitAccountSettings] =
  makeEvent<LocalAccountSettings>()
watchAccountSettings(s => {
  localAccountSettings = s
})

/**
 * How much the cached settings can be trusted.
 *
 * Three states, not a boolean, because the write path has to tell "nothing
 * has read the file yet" from "the read ran and could not read the file".
 * The second is the dangerous one: the lenient reader answers it with the 13
 * defaults, and a read-modify-write built on those persists them over a
 * `Settings.json` that is present and merely unreadable — losing
 * `spendingLimits`, `passwordReminder`, `notifState`, `reviewTrigger`,
 * `developerModeOn`, `isAccountBalanceVisible` and `tokenWarningsShown`.
 *
 * `untrusted` forces a re-read on every read, so a transient failure heals
 * itself; and it sends the write door to the file rather than to this
 * cache, so a persistent one cannot overwrite the file it could not read.
 */
type SettingsTrust = 'unread' | 'trusted' | 'untrusted'
let settingsTrust: SettingsTrust = 'unread'

/**
 * Resets the local account settings cache. Must be called on logout to prevent
 * one account's settings from persisting to a subsequent account's session.
 */
export const resetLocalAccountSettingsCache = (): void => {
  settingsTrust = 'unread'
  localAccountSettings = asLocalAccountSettings({})
}

export const getLocalAccountSettings = async (
  account: EdgeAccount
): Promise<LocalAccountSettings> => {
  if (settingsTrust === 'trusted') return localAccountSettings
  const settings = await readLocalAccountSettings(account)
  return settings
}

export function useAccountSettings(): LocalAccountSettings {
  const [accountSettings, setAccountSettings] =
    React.useState(localAccountSettings)
  React.useEffect(() => watchAccountSettings(setAccountSettings), [])
  return accountSettings
}

/**
 * Returns a notification indicator number for the badge:
 * - undefined: no badge (all notifications completed)
 * - 0: show dot (has ANY priority notifications)
 * - number: show count (has ONLY non-priority notifications)
 */
export function useNotifCount(): number | undefined {
  const { notifState } = useAccountSettings()
  const isDuressAccount = useSelector(
    state => state.core.account.isDuressAccount
  )
  return React.useMemo(() => {
    const priorityCount = Object.entries(notifState)
      .filter(
        ([type]) =>
          !(
            isDuressAccount &&
            ['pwReminder', 'otpReminder', 'ip2FaReminder'].includes(type)
          )
      )
      .filter(
        ([, notifInfo]) => notifInfo.isPriority && !notifInfo.isCompleted
      ).length
    const incompleteCount = Object.entries(notifState)
      .filter(
        ([type]) =>
          !(
            isDuressAccount &&
            ['pwReminder', 'otpReminder', 'ip2FaReminder'].includes(type)
          )
      )
      .filter(([, notifInfo]) => !notifInfo.isCompleted).length

    return priorityCount === 0 && incompleteCount === 0
      ? undefined
      : priorityCount > 0
      ? 0
      : incompleteCount
  }, [notifState, isDuressAccount])
}

export function toggleAccountBalanceVisibility(): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState()
    const { account } = state.core
    const currentAccountBalanceVisibility =
      state.ui.settings.isAccountBalanceVisible
    const isAccountBalanceVisible = !currentAccountBalanceVisibility
    await writeAccountBalanceVisibility(account, isAccountBalanceVisible)
    dispatch({
      type: 'UI/SETTINGS/SET_ACCOUNT_BALANCE_VISIBILITY',
      data: { isAccountBalanceVisible }
    })

    // Users often hide their balances by accident and then contact support
    // thinking their funds are gone, so explain how to get them back:
    if (!isAccountBalanceVisible) {
      showToast(lstrings.fragment_wallets_balance_hidden_toast, TOAST_HIDE_MS)
    }
  }
}

export function setPasswordReminder(
  passwordReminder: PasswordReminder
): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState()
    const account = state.core.account
    await writePasswordReminderSetting(account, passwordReminder)
  }
}

export function setDeveloperModeOn(
  developerModeOn: boolean
): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState()
    const { account } = state.core
    await writeDeveloperModeSetting(account, developerModeOn)
    if (developerModeOn) {
      dispatch({ type: 'DEVELOPER_MODE_ON' })
    } else {
      dispatch({ type: 'DEVELOPER_MODE_OFF' })
    }
  }
}

export function setSpamFilterOn(
  spamFilterOn: boolean
): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState()
    const { account } = state.core
    await writeSpamFilterSetting(account, spamFilterOn)
    if (spamFilterOn) {
      dispatch({ type: 'SPAM_FILTER_ON' })
    } else {
      dispatch({ type: 'SPAM_FILTER_OFF' })
    }
  }
}

const writePasswordReminderSetting = async (
  account: EdgeAccount,
  passwordReminder: PasswordReminder
): Promise<LocalAccountSettings> =>
  await updateLocalAccountSettings(account, settings => ({
    ...settings,
    passwordReminder
  }))

const writeAccountBalanceVisibility = async (
  account: EdgeAccount,
  isAccountBalanceVisible: boolean
): Promise<LocalAccountSettings> => {
  return await updateLocalAccountSettings(account, settings => ({
    ...settings,
    isAccountBalanceVisible
  }))
}

const writeDeveloperModeSetting = async (
  account: EdgeAccount,
  developerModeOn: boolean
): Promise<LocalAccountSettings> => {
  return await updateLocalAccountSettings(account, settings => ({
    ...settings,
    developerModeOn
  }))
}

const writeSpamFilterSetting = async (
  account: EdgeAccount,
  spamFilterOn: boolean
): Promise<LocalAccountSettings> => {
  return await updateLocalAccountSettings(account, settings => ({
    ...settings,
    spamFilterOn
  }))
}

export const writeContactsPermissionShown = async (
  account: EdgeAccount,
  contactsPermissionShown: boolean
): Promise<LocalAccountSettings> => {
  return await updateLocalAccountSettings(account, settings => ({
    ...settings,
    contactsPermissionShown
  }))
}

export const writeSpendingLimits = async (
  account: EdgeAccount,
  spendingLimits: SpendingLimits
): Promise<LocalAccountSettings> => {
  const out = updateLocalAccountSettings(account, settings => ({
    ...settings,
    spendingLimits
  }))
  logActivity(
    `Set Spending Limits: ${account.username} -- ${JSON.stringify(
      spendingLimits.transaction
    )}`
  )
  return await out
}

/**
 * Overwrite the values of account notifications or create new values per specific
 * `notifState` key
 **/
export const writeAccountNotifInfo = async (
  account: EdgeAccount,
  accountNotifStateKey: string,
  notifInfo: Partial<NotifInfo>
): Promise<LocalAccountSettings> => {
  return await updateLocalAccountSettings(account, settings => ({
    ...settings,
    notifState: {
      ...settings.notifState,
      [accountNotifStateKey]: {
        ...(settings.notifState[accountNotifStateKey] ?? asNotifInfo({})),
        ...notifInfo
      }
    }
  }))
}

/**
 * Persists the user's acknowledgment of the Nym multi-asset performance
 * warning so it is only shown once per account.
 */
export const writeNymWarningShown = async (
  account: EdgeAccount
): Promise<LocalAccountSettings> => {
  return await updateLocalAccountSettings(account, settings => ({
    ...settings,
    isNymWarningShown: true
  }))
}

/**
 * Persists the user's acknowledgment of the QR scanner scam warning so it is
 * only shown once per account, on the first use of the camera.
 */
export const writeCameraScamWarningShown = async (
  account: EdgeAccount
): Promise<LocalAccountSettings> => {
  return await updateLocalAccountSettings(account, settings => ({
    ...settings,
    cameraScamWarningShown: true
  }))
}

/**
 * Tracks whether a token gas requirement warning has been shown per a
 * particular currency plugin. If the plugin id exists in this array, the
 * warning will not be shown again for that currency plugin.
 */
export const writeTokenWarningsShown = async (
  account: EdgeAccount,
  pluginId: string
): Promise<LocalAccountSettings> => {
  // Use a Set to ensure there's no duplicates when adding to this info
  return await updateLocalAccountSettings(account, settings => ({
    ...settings,
    tokenWarningsShown: Array.from(
      new Set([...settings.tokenWarningsShown, pluginId])
    )
  }))
}

export const readLocalAccountSettings = async (
  account: EdgeAccount
): Promise<LocalAccountSettings> => {
  // If we've already read from disk, return the cached settings.
  // This prevents stale disk reads from overwriting newer in-memory writes
  // that may not have been persisted to disk yet.
  if (settingsTrust === 'trusted') {
    return localAccountSettings
  }

  // Lenient: this is the GUI's read-only cached reader, reached from
  // `initializeAccount`, and before this branch it could not fail. A
  // `Settings.json` that is present but unreadable must not stop the login.
  // The trust state records that it could not be read, which does two
  // things: this reader tries again on the next call, and
  // `updateLocalAccountSettings` reads the file for itself rather than
  // building on these defaults — the loss the strict reader exists to prevent.
  const { settings, trusted } = await readLocalAccountSettingsOrDefaults(
    account
  )
  emitAccountSettings(settings)
  settingsTrust = trusted ? 'trusted' : 'untrusted'
  return settings
}

/**
 * Change the local settings, starting from what the file really holds.
 *
 * The one write door, and it takes the change rather than a finished
 * object. Every writer used to read through the cache, spread its field
 * over the result and hand the whole object back — so while the cache was
 * `untrusted` that object was the defaults plus one field, and a strict
 * read that then *succeeded* proved the file readable and wrote the
 * defaults over it anyway, losing `spendingLimits`, `passwordReminder`,
 * `notifState` and the rest. Here the change is applied to the base this
 * call established, so it always lands on the real file.
 */
export const updateLocalAccountSettings = async (
  account: EdgeAccount,
  update: (settings: LocalAccountSettings) => LocalAccountSettings
): Promise<LocalAccountSettings> => {
  let base = localAccountSettings
  if (settingsTrust !== 'trusted') {
    // Strictly, because this is a write path: an unreadable file must not be
    // answered with the 12 defaults and written back, and an absent one is
    // answered with those defaults exactly as the lenient reader would.
    //
    // `untrusted` is the same call rather than a refusal. Refusing was
    // right about the write and wrong about the way out: the message told
    // the user to try again, and a `Settings.json` that is present and
    // broken does not repair itself, so every later write failed the same
    // way forever — spending limits included. There was nothing they could
    // do, either: the file is on `account.localDisklet` inside the app's
    // private container, and `ios/edge/Info.plist` sets neither
    // `UIFileSharingEnabled` nor `LSSupportsOpeningDocumentsInPlace`, so it
    // is not in the Files app and on Android it is app-private.
    //
    // So the reader tries twice and then moves the file aside, which loses
    // nothing a caller could have read anyway and leaves the bytes on the
    // disklet for support. The toast stays for the case where even that
    // fails — a disklet that cannot be read or written at all.
    try {
      const { settings, recovery } = await readLocalAccountSettingsForWrite(
        account
      )
      base = settings
      if (recovery?.kind === 'moved') {
        logActivity(
          `Moved unreadable ${LOCAL_SETTINGS_FILENAME} to ${recovery.to}`
        )
      } else if (recovery?.kind === 'deleted') {
        logActivity(
          `Deleted ${LOCAL_SETTINGS_FILENAME}, which would not decrypt: ${recovery.reason}`
        )
      }
    } catch (error: unknown) {
      // The door itself did not open, so there is no writable file to
      // recover to. Logged first, because the translated message below is
      // all the user sees and says nothing about the cause. Translated,
      // because this one reaches the user — every writer in this module
      // funnels through here, `SpendingLimitsScene` hands the rejection to
      // `showError`, and `translateError` has no arm for a bare `Error`, so
      // it renders `message` verbatim in the drop-down.
      logActivity(
        `Could not open ${LOCAL_SETTINGS_FILENAME} for writing: ${errorMessage(
          error
        )}`
      )
      throw new Error(lstrings.settings_not_saved_unreadable_file)
    }
    settingsTrust = 'trusted'
  }
  const settings = update(base)
  // Refresh cache, notify callers
  emitAccountSettings(settings)
  await writeLocalAccountSettingsToDisk(account, settings)
  return settings
}
