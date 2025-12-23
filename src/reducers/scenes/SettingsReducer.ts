import type { EdgeAccount } from 'edge-core-js'

import {
  asSyncedAccountSettings,
  type DenominationSettings,
  type SyncedAccountSettings
} from '../../actions/SettingsActions'
import type { Action } from '../../types/reduxTypes'
import {
  asLocalAccountSettings,
  type LocalAccountSettings
} from '../../types/types'
import { spendingLimits } from '../SpendingLimitsReducer'

export const initialState: SettingsState = {
  ...asSyncedAccountSettings({}),
  ...asLocalAccountSettings({}),
  changesLocked: true,
  settingsLoaded: null,
  userPausedWalletsSet: null
}

export interface SettingsState
  extends LocalAccountSettings,
    SyncedAccountSettings {
  changesLocked: boolean
  settingsLoaded: boolean | null

  // A copy of `userPausedWallets`, but as a set.
  // This is `null` until we load the setting from disk.
  userPausedWalletsSet: Set<string> | null
}

export interface LoginPayload {
  account: EdgeAccount
  syncedSettings: SyncedAccountSettings
  localSettings: LocalAccountSettings
}

export const settingsLegacy = (
  state: SettingsState = initialState,
  action: Action
): SettingsState => {
  switch (action.type) {
    case 'LOGIN': {
      const { syncedSettings, localSettings } = action.data
      const {
        autoLogoutTimeInSeconds,
        countryCode,
        defaultFiat,
        defaultIsoFiat,
        denominationSettings,
        mostRecentWallets,
        passwordRecoveryRemindersShown,
        preferredSwapPluginId,
        preferredSwapPluginType,
        securityCheckedWallets,
        stateProvinceCode,
        userPausedWallets,
        walletsSort,
        rampLastFiatCurrencyCode,
        rampLastCryptoSelection
      } = syncedSettings
      const {
        contactsPermissionShown,
        developerModeOn,
        isAccountBalanceVisible,
        spamFilterOn
      } = localSettings

      return {
        ...state,
        autoLogoutTimeInSeconds,
        contactsPermissionShown,
        countryCode,
        defaultFiat,
        defaultIsoFiat,
        denominationSettings,
        developerModeOn,
        isAccountBalanceVisible,
        mostRecentWallets,
        passwordRecoveryRemindersShown,
        userPausedWallets,
        userPausedWalletsSet: new Set(userPausedWallets),
        preferredSwapPluginId:
          preferredSwapPluginId === '' ? undefined : preferredSwapPluginId,
        preferredSwapPluginType,
        securityCheckedWallets,
        settingsLoaded: true,
        stateProvinceCode,
        spamFilterOn,
        walletsSort,
        rampLastFiatCurrencyCode,
        rampLastCryptoSelection
      }
    }
    case 'DEVELOPER_MODE_ON': {
      return { ...state, developerModeOn: true }
    }
    case 'DEVELOPER_MODE_OFF': {
      return { ...state, developerModeOn: false }
    }
    case 'SPAM_FILTER_ON': {
      return { ...state, spamFilterOn: true }
    }
    case 'SPAM_FILTER_OFF': {
      return { ...state, spamFilterOn: false }
    }

    case 'UI/SETTINGS/SET_DENOMINATION_KEY': {
      const { pluginId, currencyCode, denomination } = action.data

      // Ensure pluginId object exists before setting denomination
      const newDenominationSettings: DenominationSettings = {
        ...state.denominationSettings,
        [pluginId]: {
          ...state.denominationSettings[pluginId],
          [currencyCode]: {
            ...denomination,
            symbol: denomination.symbol ?? undefined
          }
        }
      }

      return {
        ...state,
        denominationSettings: newDenominationSettings
      }
    }

    case 'UI/SETTINGS/UPDATE_SETTINGS': {
      const { settings } = action.data
      return settings
    }

    case 'UI/SETTINGS/SET_AUTO_LOGOUT_TIME': {
      const { autoLogoutTimeInSeconds } = action.data
      return {
        ...state,
        autoLogoutTimeInSeconds
      }
    }

    case 'UI/SETTINGS/SET_CONTACTS_PERMISSION_SHOWN': {
      const { contactsPermissionShown } = action.data
      return {
        ...state,
        contactsPermissionShown
      }
    }

    case 'UI/SETTINGS/SET_DEFAULT_FIAT': {
      const { defaultFiat } = action.data
      return {
        ...state,
        defaultFiat,
        defaultIsoFiat: `iso:${defaultFiat}`
      }
    }

    case 'UI/SETTINGS/SET_PREFERRED_SWAP_PLUGIN': {
      const pluginId = action.data
      return { ...state, preferredSwapPluginId: pluginId }
    }

    case 'UI/SETTINGS/SET_PREFERRED_SWAP_PLUGIN_TYPE': {
      const swapPluginType = action.data
      return { ...state, preferredSwapPluginType: swapPluginType }
    }

    case 'UI/SETTINGS/SET_SETTINGS_LOCK': {
      return {
        ...state,
        changesLocked: action.data
      }
    }

    case 'UI/SETTINGS/SET_MOST_RECENT_WALLETS': {
      return {
        ...state,
        mostRecentWallets: action.data.mostRecentWallets
      }
    }

    case 'UI/SETTINGS/SET_ACCOUNT_BALANCE_VISIBILITY': {
      return {
        ...state,
        isAccountBalanceVisible: action.data.isAccountBalanceVisible
      }
    }

    case 'UI/SETTINGS/SET_USER_PAUSED_WALLETS': {
      const { userPausedWallets } = action.data
      return {
        ...state,
        userPausedWallets,
        userPausedWalletsSet: new Set(userPausedWallets)
      }
    }

    case 'UI/SETTINGS/SET_WALLETS_SORT': {
      return {
        ...state,
        walletsSort: action.data.walletsSort
      }
    }

    case 'UPDATE_SHOW_PASSWORD_RECOVERY_REMINDER_MODAL': {
      const level = action.data
      const passwordRecoveryRemindersShown = {
        ...state.passwordRecoveryRemindersShown
      }
      passwordRecoveryRemindersShown[level] = true
      return { ...state, passwordRecoveryRemindersShown }
    }
    default:
      return state
  }
}

export const settings = (
  state: SettingsState = initialState,
  action: Action
): SettingsState => {
  let result = state
  const legacy = settingsLegacy(state, action)

  if (legacy !== state) {
    result = legacy
  }

  const spendingLimitsObj = spendingLimits(state.spendingLimits, action)

  if (spendingLimitsObj !== state.spendingLimits) {
    result = {
      ...result,
      spendingLimits: spendingLimitsObj
    }
  }

  return result
}
