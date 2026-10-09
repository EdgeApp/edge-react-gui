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
  type NotifState,
  type PasswordReminder,
  type SpendingLimits
} from '../types/types'
import {
  LOCAL_SETTINGS_FILENAME,
  readLocalAccountSettingsFromDisk,
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
 * itself; and it refuses the write, so a persistent one cannot overwrite the
 * file it could not read.
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
  await getLocalAccountSettings(account).then(async settings => {
    const updatedSettings = { ...settings, passwordReminder }
    return await writeLocalAccountSettings(account, updatedSettings)
  })

const writeAccountBalanceVisibility = async (
  account: EdgeAccount,
  isAccountBalanceVisible: boolean
): Promise<LocalAccountSettings> => {
  return await getLocalAccountSettings(account).then(async settings => {
    const updatedSettings = { ...settings, isAccountBalanceVisible }
    return await writeLocalAccountSettings(account, updatedSettings)
  })
}

const writeDeveloperModeSetting = async (
  account: EdgeAccount,
  developerModeOn: boolean
): Promise<LocalAccountSettings> => {
  return await getLocalAccountSettings(account).then(async settings => {
    const updatedSettings = { ...settings, developerModeOn }
    return await writeLocalAccountSettings(account, updatedSettings)
  })
}

const writeSpamFilterSetting = async (
  account: EdgeAccount,
  spamFilterOn: boolean
): Promise<LocalAccountSettings> => {
  return await getLocalAccountSettings(account).then(async settings => {
    const updatedSettings = { ...settings, spamFilterOn }
    return await writeLocalAccountSettings(account, updatedSettings)
  })
}

export const writeContactsPermissionShown = async (
  account: EdgeAccount,
  contactsPermissionShown: boolean
): Promise<LocalAccountSettings> => {
  return await getLocalAccountSettings(account).then(async settings => {
    const updatedSettings = { ...settings, contactsPermissionShown }
    return await writeLocalAccountSettings(account, updatedSettings)
  })
}

export const writeSpendingLimits = async (
  account: EdgeAccount,
  spendingLimits: SpendingLimits
): Promise<LocalAccountSettings> => {
  return await getLocalAccountSettings(account).then(async settings => {
    const updatedSettings = { ...settings, spendingLimits }
    const out = writeLocalAccountSettings(account, updatedSettings)
    logActivity(
      `Set Spending Limits: ${account.username} -- ${JSON.stringify(
        spendingLimits.transaction
      )}`
    )
    return await out
  })
}

/**
 * Manage the state of account notifications, used by both `NotificationView` and
 * `NotificationCenterScene`
 **/
const writeAccountNotifState = async (
  account: EdgeAccount,
  notifState: NotifState
): Promise<LocalAccountSettings> => {
  const localSettings = await getLocalAccountSettings(account)
  return await writeLocalAccountSettings(account, {
    ...localSettings,
    // Merge with existing notifState to prevent concurrent writes from
    // overwriting each other's keys
    notifState: {
      ...localSettings.notifState,
      ...notifState
    }
  })
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
  const settings = await getLocalAccountSettings(account)
  return await writeAccountNotifState(account, {
    ...settings.notifState,
    [accountNotifStateKey]: {
      ...(settings.notifState[accountNotifStateKey] ?? asNotifInfo({})),
      ...notifInfo
    }
  })
}

/**
 * Persists the user's acknowledgment of the Nym multi-asset performance
 * warning so it is only shown once per account.
 */
export const writeNymWarningShown = async (
  account: EdgeAccount
): Promise<LocalAccountSettings> => {
  const settings = await getLocalAccountSettings(account)
  const updatedSettings = { ...settings, isNymWarningShown: true }
  return await writeLocalAccountSettings(account, updatedSettings)
}

/**
 * Persists the user's acknowledgment of the QR scanner scam warning so it is
 * only shown once per account, on the first use of the camera.
 */
export const writeCameraScamWarningShown = async (
  account: EdgeAccount
): Promise<LocalAccountSettings> => {
  const settings = await getLocalAccountSettings(account)
  const updatedSettings = { ...settings, cameraScamWarningShown: true }
  return await writeLocalAccountSettings(account, updatedSettings)
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
  const settings = await getLocalAccountSettings(account)
  // Use a Set to ensure there's no duplicates when adding to this info
  const updatedSettings = {
    ...settings,
    tokenWarningsShown: Array.from(
      new Set([...settings.tokenWarningsShown, pluginId])
    )
  }

  return await writeLocalAccountSettings(account, updatedSettings)
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
  // `writeLocalAccountSettings` refuses to persist anything built on these
  // defaults — the loss the strict reader exists to prevent.
  const { settings, trusted } = await readLocalAccountSettingsOrDefaults(
    account
  )
  emitAccountSettings(settings)
  settingsTrust = trusted ? 'trusted' : 'untrusted'
  return settings
}

export const writeLocalAccountSettings = async (
  account: EdgeAccount,
  settings: LocalAccountSettings
): Promise<LocalAccountSettings> => {
  // Every value written here is a read-modify-write: a caller takes the
  // whole settings object, changes one field and hands it back. So a base
  // that came from a file this version could not read means the other
  // twelve fields are the defaults, and writing it is the data loss, not
  // the symptom of it. Fail instead, where `writeLocalAccountSettingsToDisk`
  // can already fail, so every caller's existing error path carries it.
  if (settingsTrust === 'untrusted') {
    // Translated, because this one reaches the user: every writer in this
    // module funnels through here, `SpendingLimitsScene` hands the rejection
    // to `showError`, and `translateError` has no arm for a bare `Error`, so
    // it renders `message` verbatim in the drop-down. A hardcoded English
    // paragraph would be what a German device shows.
    //
    // And it says only what the user can act on. It used to name
    // `Settings.json` and tell them to move it aside, which is an
    // instruction no user of the shipped app can carry out: the file is on
    // `account.localDisklet` — core's `encryptDisklet`, inside the app's
    // private container — and `ios/edge/Info.plist` sets neither
    // `UIFileSharingEnabled` nor `LSSupportsOpeningDocumentsInPlace`, so it
    // is not in the Files app, and on Android it is app-private. "Try again"
    // genuinely heals it: `writeSpendingLimits` calls
    // `getLocalAccountSettings` first, which re-reads from disk while the
    // trust state is `untrusted`. The file name belongs in the
    // `reportWarning` at `localAccountSettings.ts`, which is what support
    // reads and where the other eight disklet filename constants already
    // live.
    throw new Error(lstrings.settings_not_saved_unreadable_file)
  }
  if (settingsTrust === 'unread') {
    // Nothing has read the file. Strictly, because this is a write path:
    // an unreadable file must stop it, and an absent one is answered with
    // the cleaner's defaults exactly as the lenient reader would.
    const onDisk = await readLocalAccountSettingsFromDisk(account)
    emitAccountSettings(onDisk)
    settingsTrust = 'trusted'
  }
  // Refresh cache, notify callers
  emitAccountSettings(settings)
  await writeLocalAccountSettingsToDisk(account, settings)
  return settings
}
