import { EdgeAccount } from 'edge-core-js'

import { asSyncedAccountSettings, SyncedAccountSettings } from '../../actions/SettingsActions'
import { SortOption } from '../../components/modals/WalletListSortModal'
import { Action } from '../../types/reduxTypes'
import { asLocalAccountSettings, GuiTouchIdInfo, LocalAccountSettings } from '../../types/types'
import { spendingLimits } from '../SpendingLimitsReducer'

export const initialState: SettingsState = {
  ...asSyncedAccountSettings({}),
  ...asLocalAccountSettings({}),
  changesLocked: true,
  isTouchEnabled: false,
  isTouchSupported: false,
  pinLoginEnabled: false,
  settingsLoaded: null
}

export interface SettingsState extends LocalAccountSettings, SyncedAccountSettings {
  changesLocked: boolean
  isTouchEnabled: boolean
  isTouchSupported: boolean
  pinLoginEnabled: boolean
  settingsLoaded: boolean | null
}

export interface AccountInitPayload extends SettingsState {
  account: EdgeAccount
  currencyCode: string
  pinLoginEnabled: boolean
  touchIdInfo: GuiTouchIdInfo
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
        for (const token of currencyInfo.metaTokens) {
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
        contactsPermissionOn,
        countryCode,
        defaultFiat,
        defaultIsoFiat,
        denominationSettings,
        developerModeOn,
        isAccountBalanceVisible,
        mostRecentWallets,
        passwordRecoveryRemindersShown,
        pinLoginEnabled,
        preferredSwapPluginId,
        preferredSwapPluginType,
        securityCheckedWallets,
        spamFilterOn,
        touchIdInfo,
        walletsSort
      } = action.data
      const newState: SettingsState = {
        ...state,
        autoLogoutTimeInSeconds,
        contactsPermissionOn,
        countryCode,
        defaultFiat,
        defaultIsoFiat,
        denominationSettings,
        developerModeOn,
        isAccountBalanceVisible,
        isTouchEnabled: touchIdInfo ? touchIdInfo.isTouchEnabled : false,
        isTouchSupported: touchIdInfo ? touchIdInfo.isTouchSupported : false,
        mostRecentWallets,
        passwordRecoveryRemindersShown,
        pinLoginEnabled,
        preferredSwapPluginId: preferredSwapPluginId === '' ? undefined : preferredSwapPluginId,
        preferredSwapPluginType,
        securityCheckedWallets,
        settingsLoaded: true,
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

    case 'UI/SETTINGS/SET_CONTACTS_PERMISSION': {
      const { contactsPermissionOn } = action.data
      return {
        ...state,
        contactsPermissionOn
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
