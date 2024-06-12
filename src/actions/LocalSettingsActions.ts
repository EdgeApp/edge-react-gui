import { EdgeAccount } from 'edge-core-js'
import { openSettings, PermissionStatus, request } from 'react-native-permissions'
import { sprintf } from 'sprintf-js'

import { showError } from '../components/services/AirshipInstance'
import { lstrings } from '../locales/strings'
import { permissionNames } from '../reducers/PermissionsReducer'
import { config } from '../theme/appConfig'
import { ThunkAction } from '../types/reduxTypes'
import { AccountNotifDismissInfo, asLocalAccountSettings, LocalAccountSettings, PasswordReminder, SpendingLimits } from '../types/types'
import { logActivity } from '../util/logger'

const LOCAL_SETTINGS_FILENAME = 'Settings.json'
let localAccountSettings: LocalAccountSettings = asLocalAccountSettings({})

export const getLocalAccountSettings = (): LocalAccountSettings => localAccountSettings

export function toggleAccountBalanceVisibility(): ThunkAction<void> {
  return (dispatch, getState) => {
    const state = getState()
    const { account } = state.core
    const currentAccountBalanceVisibility = state.ui.settings.isAccountBalanceVisible
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

export function setPasswordReminder(passwordReminder: PasswordReminder): ThunkAction<void> {
  return (dispatch, getState) => {
    const state = getState()
    const account = state.core.account
    writePasswordReminderSetting(account, passwordReminder).catch(error => showError(error))
  }
}

export function setDeveloperModeOn(developerModeOn: boolean): ThunkAction<void> {
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

/**
 * Toggle the 'Contacts Access' Edge setting. Will request permissions if
 * toggled on/enabled AND system-level contacts permissions are not granted.
 * Does NOT modify system-level contacts permissions if toggling the 'Contacts
 * Access' setting OFF
 */
export function setContactsPermissionOn(contactsPermissionOn: boolean): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState()
    const { account } = state.core

    await writeContactsPermissionSetting(account, contactsPermissionOn)

    if (contactsPermissionOn) {
      // Initial prompt to inform the reason of the permissions request.
      // Denying this prompt will cause permissionStatus to be 'blocked',
      // regardless of the prior permissions state.
      await request(permissionNames.contacts, {
        title: lstrings.contacts_permission_modal_title,
        message: sprintf(lstrings.contacts_permission_modal_body_1, config.appName),
        buttonPositive: lstrings.string_allow,
        buttonNegative: lstrings.string_deny
      })
        .then(async (permissionStatus: PermissionStatus) => {
          // Can't request permission from within the app if previously blocked
          if (permissionStatus === 'blocked') await openSettings()
        })
        // Handle any other potential failure in enabling the permission
        // progmatically from within Edge by redirecting to the system settings
        // instead. Any manual change in system settings causes an app restart.
        .catch(async _e => await openSettings())
    }

    dispatch({ type: 'UI/SETTINGS/SET_CONTACTS_PERMISSION', data: { contactsPermissionOn } })
  }
}

const writePasswordReminderSetting = async (account: EdgeAccount, passwordReminder: PasswordReminder) =>
  await readLocalAccountSettings(account).then(async settings => {
    const updatedSettings = { ...settings, passwordReminder }
    return await writeLocalAccountSettings(account, updatedSettings)
  })

const writeAccountBalanceVisibility = async (account: EdgeAccount, isAccountBalanceVisible: boolean) => {
  return await readLocalAccountSettings(account).then(async settings => {
    const updatedSettings = { ...settings, isAccountBalanceVisible }
    return await writeLocalAccountSettings(account, updatedSettings)
  })
}

const writeDeveloperModeSetting = async (account: EdgeAccount, developerModeOn: boolean) => {
  return await readLocalAccountSettings(account).then(async settings => {
    const updatedSettings = { ...settings, developerModeOn }
    return await writeLocalAccountSettings(account, updatedSettings)
  })
}

const writeSpamFilterSetting = async (account: EdgeAccount, spamFilterOn: boolean) => {
  return await readLocalAccountSettings(account).then(async settings => {
    const updatedSettings = { ...settings, spamFilterOn }
    return await writeLocalAccountSettings(account, updatedSettings)
  })
}

const writeContactsPermissionSetting = async (account: EdgeAccount, contactsPermissionOn: boolean) => {
  return await readLocalAccountSettings(account).then(async settings => {
    const updatedSettings = { ...settings, contactsPermissionOn }
    return await writeLocalAccountSettings(account, updatedSettings)
  })
}

export const writeSpendingLimits = async (account: EdgeAccount, spendingLimits: SpendingLimits) => {
  return await readLocalAccountSettings(account).then(async settings => {
    const updatedSettings = { ...settings, spendingLimits }
    const out = writeLocalAccountSettings(account, updatedSettings)
    logActivity(`Set Spending Limits: ${account.username} -- ${JSON.stringify(spendingLimits.transaction)}`)
    return await out
  })
}

/**
 * Track the state of whether particular one-time notifications associated with
 * the account were interacted with or dismissed.
 **/
export const writeNotifDismissInfo = async (account: EdgeAccount, accountNotifDismissInfo: AccountNotifDismissInfo) => {
  const updatedSettings = { ...localAccountSettings, accountNotifDismissInfo }
  return await writeLocalAccountSettings(account, updatedSettings)
}

/**
 * Tracks whether a token gas requirement warning has been shown per a
 * particular currency plugin. If the plugin id exists in this array, the
 * warning will not be shown again for that currency plugin.
 */
export const writeTokenWarningsShown = async (account: EdgeAccount, pluginId: string) => {
  // Use a Set to ensure there's no duplicates when adding to this info
  const updatedSettings = {
    ...localAccountSettings,
    tokenWarningsShown: Array.from(new Set([...localAccountSettings.tokenWarningsShown, pluginId]))
  }

  return await writeLocalAccountSettings(account, updatedSettings)
}

export const readLocalAccountSettings = async (account: EdgeAccount): Promise<LocalAccountSettings> => {
  try {
    const text = await account.localDisklet.getText(LOCAL_SETTINGS_FILENAME)
    const json = JSON.parse(text)
    const settings = asLocalAccountSettings(json)
    localAccountSettings = settings
    return settings
  } catch (e) {
    const defaults = asLocalAccountSettings({})
    return await writeLocalAccountSettings(account, defaults).then(() => defaults)
  }
}

export const writeLocalAccountSettings = async (account: EdgeAccount, settings: LocalAccountSettings) => {
  localAccountSettings = asLocalAccountSettings(settings)
  const text = JSON.stringify(settings)
  return await account.localDisklet.setText(LOCAL_SETTINGS_FILENAME, text)
}
