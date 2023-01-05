import { EdgeAccount, EdgeSwapPluginType } from 'edge-core-js'

import ENV from '../../../env.json'
import { SortOption } from '../../components/modals/WalletListSortModal'
import { DenominationSettings, LOCAL_ACCOUNT_DEFAULTS, SYNCED_ACCOUNT_DEFAULTS } from '../../modules/Core/Account/settings'
import { Action } from '../../types/reduxTypes'
import { GuiTouchIdInfo, MostRecentWallet, SpendingLimits } from '../../types/types'
import { PasswordReminderState } from '../PasswordReminderReducer'
import { spendingLimits } from '../SpendingLimitsReducer'

// prettier-ignore
export interface PasswordReminderLevels {
  '20': boolean,
  '200': boolean,
  '2000': boolean,
  '20000': boolean,
  '200000': boolean
}

export interface AccountInitPayload {
  account: EdgeAccount
  autoLogoutTimeInSeconds: number
  countryCode: string
  currencyCode: string
  defaultFiat: string
  defaultIsoFiat: string
  denominationSettings: DenominationSettings
  developerModeOn: boolean
  isAccountBalanceVisible: boolean
  mostRecentWallets: MostRecentWallet[]
  passwordRecoveryRemindersShown: PasswordReminderLevels
  passwordReminder: PasswordReminderState
  pinLoginEnabled: boolean
  preferredSwapPluginId: string | undefined
  preferredSwapPluginType: EdgeSwapPluginType | undefined
  spamFilterOn: boolean
  spendingLimits: SpendingLimits
  touchIdInfo: GuiTouchIdInfo
  walletId: string
  walletsSort: SortOption
}

export const initialState = {
  ...SYNCED_ACCOUNT_DEFAULTS,
  ...LOCAL_ACCOUNT_DEFAULTS,
  changesLocked: true,
  pinLoginEnabled: false,
  loginStatus: null,
  isTouchSupported: false,
  isTouchEnabled: false,
  isAccountBalanceVisible: true,
  walletsSort: 'manual',
  mostRecentWallets: [],
  spendingLimits: {
    transaction: {
      isEnabled: false,
      amount: 0
    }
  },
  developerModeOn: false,
  // prettier-ignore
  passwordRecoveryRemindersShown: {
    '20': false,
    '200': false,
    '2000': false,
    '20000': false,
    '200000': false
  }
}

export interface SettingsState {
  denominationSettings: DenominationSettings
  autoLogoutTimeInSeconds: number
  changesLocked: any
  defaultFiat: string
  defaultIsoFiat: string
  isTouchEnabled: boolean
  countryCode: string
  isTouchSupported: boolean
  loginStatus: boolean | null
  preferredSwapPluginId: string | undefined
  preferredSwapPluginType: EdgeSwapPluginType | undefined
  pinLoginEnabled: boolean
  isAccountBalanceVisible: boolean
  walletsSort: SortOption
  mostRecentWallets: MostRecentWallet[]
  spamFilterOn: boolean
  spendingLimits: {
    transaction: {
      isEnabled: boolean
      amount: number
    }
  }
  developerModeOn: boolean
  passwordRecoveryRemindersShown: PasswordReminderLevels
}

// @ts-expect-error
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
        touchIdInfo,
        autoLogoutTimeInSeconds,
        defaultFiat,
        defaultIsoFiat,
        preferredSwapPluginId,
        preferredSwapPluginType,
        countryCode,
        pinLoginEnabled,
        denominationSettings,
        isAccountBalanceVisible,
        walletsSort,
        mostRecentWallets,
        passwordRecoveryRemindersShown,
        spamFilterOn,
        developerModeOn
      } = action.data
      const newState: SettingsState = {
        ...state,
        loginStatus: true,
        autoLogoutTimeInSeconds,
        isTouchEnabled: touchIdInfo ? touchIdInfo.isTouchEnabled : false,
        isTouchSupported: touchIdInfo ? touchIdInfo.isTouchSupported : false,
        defaultFiat,
        defaultIsoFiat,
        preferredSwapPluginId: preferredSwapPluginId === '' ? undefined : preferredSwapPluginId,
        preferredSwapPluginType,
        countryCode,
        pinLoginEnabled,
        denominationSettings,
        isAccountBalanceVisible,
        walletsSort,
        mostRecentWallets,
        passwordRecoveryRemindersShown,
        spamFilterOn,
        developerModeOn
      }
      if (developerModeOn && ENV.BETA_FEATURES_DEV_MODE_ONLY) ENV.BETA_FEATURES = true
      return newState
    }
    case 'DEVELOPER_MODE_ON': {
      if (ENV.BETA_FEATURES_DEV_MODE_ONLY) ENV.BETA_FEATURES = true
      return { ...state, developerModeOn: true }
    }
    case 'DEVELOPER_MODE_OFF': {
      if (ENV.BETA_FEATURES_DEV_MODE_ONLY) ENV.BETA_FEATURES = false
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

// @ts-expect-error
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
