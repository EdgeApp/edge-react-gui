import { EdgeAccount } from 'edge-core-js'
import React from 'react'
import { makeEvent } from 'yavent'

import { showError } from '../components/services/AirshipInstance'
import { useSelector } from '../types/reactRedux'
import { ThunkAction } from '../types/reduxTypes'
import {
  asLocalAccountSettings,
  asNotifInfo,
  LocalAccountSettings,
  NotifInfo,
  NotifState,
  PasswordReminder,
  SpendingLimits
} from '../types/types'
import { logActivity } from '../util/logger'

export const LOCAL_SETTINGS_FILENAME = 'Settings.json'

let localAccountSettings: LocalAccountSettings = asLocalAccountSettings({})
const [watchAccountSettings, emitAccountSettings] =
  makeEvent<LocalAccountSettings>()
watchAccountSettings(s => {
  localAccountSettings = s
})

let readSettingsFromDisk = false
export const getLocalAccountSettings = async (
  account: EdgeAccount
): Promise<LocalAccountSettings> => {
  if (readSettingsFromDisk) return localAccountSettings
  const settings = await readLocalAccountSettings(account)
  return settings
}

export function useAccountSettings() {
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

export function toggleAccountBalanceVisibility(): ThunkAction<void> {
  return (dispatch, getState) => {
    const state = getState()
    const { account } = state.core
    const currentAccountBalanceVisibility =
      state.ui.settings.isAccountBalanceVisible
    writeAccountBalanceVisibility(account, !currentAccountBalanceVisibility)
      .then(() => {
        dispatch({
          type: 'UI/SETTINGS/SET_ACCOUNT_BALANCE_VISIBILITY',
          data: { isAccountBalanceVisible: !currentAccountBalanceVisibility }
        })
      })
      .catch(error => showError(error))
  }
}

export function setPasswordReminder(
  passwordReminder: PasswordReminder
): ThunkAction<void> {
  return (dispatch, getState) => {
    const state = getState()
    const account = state.core.account
    writePasswordReminderSetting(account, passwordReminder).catch(error =>
      showError(error)
    )
  }
}

export function setDeveloperModeOn(
  developerModeOn: boolean
): ThunkAction<void> {
  return (dispatch, getState) => {
    const state = getState()
    const { account } = state.core
    writeDeveloperModeSetting(account, developerModeOn)
      .then(() => {
        if (developerModeOn) {
          dispatch({ type: 'DEVELOPER_MODE_ON' })
          return
        }
        dispatch({ type: 'DEVELOPER_MODE_OFF' })
      })
      .catch(error => showError(error))
  }
}

export function setSpamFilterOn(spamFilterOn: boolean): ThunkAction<void> {
  return (dispatch, getState) => {
    const state = getState()
    const { account } = state.core
    writeSpamFilterSetting(account, spamFilterOn)
      .then(() => {
        if (spamFilterOn) {
          dispatch({ type: 'SPAM_FILTER_ON' })
          return
        }
        dispatch({ type: 'SPAM_FILTER_OFF' })
      })
      .catch(error => showError(error))
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
    notifState
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
  try {
    const text = await account.localDisklet.getText(LOCAL_SETTINGS_FILENAME)
    const json = JSON.parse(text)
    const settings = asLocalAccountSettings(json)
    emitAccountSettings(settings)
    readSettingsFromDisk = true
    return settings
  } catch (e) {
    const defaults = asLocalAccountSettings({})
    return await writeLocalAccountSettings(account, defaults)
  }
}

export const writeLocalAccountSettings = async (
  account: EdgeAccount,
  settings: LocalAccountSettings
): Promise<LocalAccountSettings> => {
  // Refresh cache, notify callers
  emitAccountSettings(settings)

  const text = JSON.stringify(settings)
  await account.localDisklet.setText(LOCAL_SETTINGS_FILENAME, text)

  return settings
}
