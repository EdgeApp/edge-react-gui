import { EdgeAccount } from 'edge-core-js'

import { asSyncedAccountSettings, SyncedAccountSettings } from '../../actions/SettingsActions'
import { SortOption } from '../../components/modals/WalletListSortModal'
import { Action } from '../../types/reduxTypes'
import { asLocalAccountSettings, LocalAccountSettings } from '../../types/types'
import { spendingLimits } from '../SpendingLimitsReducer'

export const initialState: SettingsState = {
  ...asSyncedAccountSettings({}),
  ...asLocalAccountSettings({}),
  changesLocked: true,
  isTouchEnabled: false,
  isTouchSupported: false,
  pinLoginEnabled: false,
  settingsLoaded: null,
  userPausedWalletsSet: null
}

export interface SettingsState extends LocalAccountSettings, SyncedAccountSettings {
  changesLocked: boolean
  isTouchEnabled: boolean
  isTouchSupported: boolean
  pinLoginEnabled: boolean
  settingsLoaded: boolean | null

  // A copy of `userPausedWallets`, but as a set.
  // This is `null` until we load the setting from disk.
  userPausedWalletsSet: Set<string> | null
}

export interface AccountInitPayload extends SettingsState {
  account: EdgeAccount
  currencyCode: string
  pinLoginEnabled: boolean
  isTouchEnabled: boolean
  isTouchSupported: boolean
  walletId: string
  walletsSort: SortOption
}

export const settingsLegacy = (state: SettingsState = initialState, action: Action): SettingsState => {
  switch (action.type) {
    case 'LOGIN': {
      const { account, walletSort } = action.data

      // Setup default denominations for settings based on currencyInfo
      const newState = { ...state, walletSort }
      for (const pluginId of Object.keys(account.currencyConfig)) {
        const { currencyInfo } = account.currencyConfig[pluginId]
        const { currencyCode } = currencyInfo
        if (newState.denominationSettings[pluginId] == null) state.denominationSettings[pluginId] = {}
        // @ts-expect-error
        if (newState.denominationSettings[pluginId][currencyCode] == null) {
          // @ts-expect-error
          newState.denominationSettings[pluginId][currencyCode] = currencyInfo.denominations[0]
        }
        for (const token of currencyInfo.metaTokens ?? []) {
          const tokenCode = token.currencyCode
          // @ts-expect-error
          newState.denominationSettings[pluginId][tokenCode] = token.denominations[0]
        }
      }
      return newState
    }

    case 'ACCOUNT_INIT_COMPLETE': {
      const {
        autoLogoutTimeInSeconds,
        contactsPermissionShown,
        countryCode,
        defaultFiat,
        defaultIsoFiat,
        denominationSettings,
        developerModeOn,
        isAccountBalanceVisible,
        isTouchEnabled,
        isTouchSupported,
        mostRecentWallets,
        passwordRecoveryRemindersShown,
        userPausedWallets,
        pinLoginEnabled,
        preferredSwapPluginId,
        preferredSwapPluginType,
        securityCheckedWallets,
        spamFilterOn,
        stateProvinceCode,
        walletsSort
      } = action.data
      const newState: SettingsState = {
        ...state,
        autoLogoutTimeInSeconds,
        contactsPermissionShown,
        countryCode,
        defaultFiat,
        defaultIsoFiat,
        denominationSettings,
        developerModeOn,
        isAccountBalanceVisible,
        isTouchEnabled,
        isTouchSupported,
        mostRecentWallets,
        passwordRecoveryRemindersShown,
        userPausedWallets,
        userPausedWalletsSet: new Set(userPausedWallets),
        pinLoginEnabled,
        preferredSwapPluginId: preferredSwapPluginId === '' ? undefined : preferredSwapPluginId,
        preferredSwapPluginType,
        securityCheckedWallets,
        settingsLoaded: true,
        stateProvinceCode,
        spamFilterOn,
        walletsSort
      }
      return newState
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

    case 'UI/SETTINGS/TOGGLE_PIN_LOGIN_ENABLED': {
      const { pinLoginEnabled } = action.data
      return {
        ...state,
        pinLoginEnabled
      }
    }

    case 'UI/SETTINGS/SET_DENOMINATION_KEY': {
      const { pluginId, currencyCode, denomination } = action.data
      const newDenominationSettings = { ...state.denominationSettings }
      // @ts-expect-error
      newDenominationSettings[pluginId][currencyCode] = denomination

      return {
        ...state,
        ...newDenominationSettings
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

    case 'UI/SETTINGS/CHANGE_TOUCH_ID_SETTINGS': {
      return {
        ...state,
        isTouchEnabled: action.data.isTouchEnabled
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
      const passwordRecoveryRemindersShown = { ...state.passwordRecoveryRemindersShown }
      passwordRecoveryRemindersShown[level] = true
      return { ...state, passwordRecoveryRemindersShown }
    }
    default:
      return state
  }
}

export const settings = (state: SettingsState = initialState, action: Action): SettingsState => {
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
