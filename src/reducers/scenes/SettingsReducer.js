// @flow

import { type EdgeAccount, type EdgeCurrencyInfo } from 'edge-core-js'

import type { SortOption } from '../../components/modals/WalletListSortModal.js'
import { type DenominationSettings, LOCAL_ACCOUNT_DEFAULTS, SYNCED_ACCOUNT_DEFAULTS } from '../../modules/Core/Account/settings.js'
import { getDenominationFromCurrencyInfo } from '../../selectors/DenominationSelectors.js'
import type { Action } from '../../types/reduxTypes.js'
import { type CustomTokenInfo, type GuiTouchIdInfo, type MostRecentWallet, type SpendingLimits } from '../../types/types.js'
import { type PasswordReminderState } from '../PasswordReminderReducer.js'
import { spendingLimits } from '../SpendingLimitsReducer.js'

// prettier-ignore
export type PasswordReminderLevels = {
  '20': boolean,
  '200': boolean,
  '2000': boolean,
  '20000': boolean,
  '200000': boolean
}

export type AccountInitPayload = {|
  account: EdgeAccount,
  activeWalletIds: string[],
  archivedWalletIds: string[],
  autoLogoutTimeInSeconds: number,
  countryCode: string,
  currencyCode: string,
  customTokens: CustomTokenInfo[],
  defaultFiat: string,
  defaultIsoFiat: string,
  denominationSettings: DenominationSettings,
  developerModeOn: boolean,
  isAccountBalanceVisible: boolean,
  mostRecentWallets: MostRecentWallet[],
  passwordRecoveryRemindersShown: PasswordReminderLevels,
  passwordReminder: PasswordReminderState,
  pinLoginEnabled: boolean,
  preferredSwapPluginId: string | void,
  spendingLimits: SpendingLimits,
  touchIdInfo: GuiTouchIdInfo,
  walletId: string,
  walletsSort: SortOption
|}

export const initialState = {
  ...SYNCED_ACCOUNT_DEFAULTS,
  ...LOCAL_ACCOUNT_DEFAULTS,
  changesLocked: true,
  plugins: {
    allCurrencyInfos: [],
    supportedWalletTypes: []
  },
  pinLoginEnabled: false,
  loginStatus: null,
  isTouchSupported: false,
  isTouchEnabled: false,
  isAccountBalanceVisible: true,
  walletsSort: 'default',
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

export type SettingsState = {
  denominationSettings: DenominationSettings,
  autoLogoutTimeInSeconds: number,
  changesLocked: any,
  customTokens: CustomTokenInfo[],
  defaultFiat: string,
  defaultIsoFiat: string,
  isTouchEnabled: boolean,
  countryCode: string,
  isTouchSupported: boolean,
  loginStatus: boolean | null,
  preferredSwapPluginId: string | void,
  pinLoginEnabled: boolean,
  plugins: {
    [pluginId: string]: EdgeCurrencyInfo,
    allCurrencyInfos: EdgeCurrencyInfo[],
    supportedWalletTypes: string[]
  },
  isAccountBalanceVisible: boolean,
  walletsSort: SortOption,
  mostRecentWallets: MostRecentWallet[],
  spendingLimits: {
    transaction: {
      isEnabled: boolean,
      amount: number
    }
  },
  developerModeOn: boolean,
  passwordRecoveryRemindersShown: PasswordReminderLevels
}

function currencyPluginUtil(state: SettingsState, currencyInfo: EdgeCurrencyInfo): SettingsState {
  const { plugins } = state
  const { allCurrencyInfos, supportedWalletTypes } = plugins
  const { pluginId, walletType } = currencyInfo

  return {
    ...state,
    plugins: {
      ...plugins,
      [pluginId]: currencyInfo,
      allCurrencyInfos: [...allCurrencyInfos, currencyInfo],
      supportedWalletTypes: [...supportedWalletTypes, walletType]
    }
  }
}

export const settingsLegacy = (state: SettingsState = initialState, action: Action) => {
  switch (action.type) {
    case 'LOGIN': {
      const account = action.data

      // Setup default denominations for settings based on currencyInfo
      const newState = { ...state }
      for (const pluginId of Object.keys(account.currencyConfig)) {
        const { currencyInfo } = account.currencyConfig[pluginId]
        const { currencyCode } = currencyInfo
        if (newState.denominationSettings[pluginId] == null) state.denominationSettings[pluginId] = {}
        if (newState.denominationSettings[pluginId][currencyCode] == null) {
          newState.denominationSettings[pluginId][currencyCode] = getDenominationFromCurrencyInfo(currencyInfo, currencyCode)
        }
        for (const token of currencyInfo.metaTokens) {
          const tokenCode = token.currencyCode
          newState.denominationSettings[pluginId][tokenCode] = getDenominationFromCurrencyInfo(currencyInfo, tokenCode)
        }
      }
      return newState
    }

    case 'ACCOUNT_INIT_COMPLETE': {
      const account: EdgeAccount = action.data.account
      const {
        touchIdInfo,
        autoLogoutTimeInSeconds,
        defaultFiat,
        defaultIsoFiat,
        preferredSwapPluginId,
        countryCode,
        customTokens,
        pinLoginEnabled,
        denominationSettings,
        isAccountBalanceVisible,
        walletsSort,
        mostRecentWallets,
        passwordRecoveryRemindersShown,
        developerModeOn
      } = action.data
      let newState: SettingsState = {
        ...state,
        loginStatus: true,
        autoLogoutTimeInSeconds,
        isTouchEnabled: touchIdInfo ? touchIdInfo.isTouchEnabled : false,
        isTouchSupported: touchIdInfo ? touchIdInfo.isTouchSupported : false,
        defaultFiat,
        defaultIsoFiat,
        preferredSwapPluginId: preferredSwapPluginId === '' ? undefined : preferredSwapPluginId,
        customTokens,
        countryCode,
        pinLoginEnabled,
        denominationSettings,
        isAccountBalanceVisible,
        walletsSort,
        mostRecentWallets,
        passwordRecoveryRemindersShown,
        developerModeOn
      }
      for (const pluginId of Object.keys(account.currencyConfig)) {
        newState = currencyPluginUtil(newState, account.currencyConfig[pluginId].currencyInfo)
      }
      return newState
    }
    case 'DEVELOPER_MODE_ON': {
      return { ...state, developerModeOn: true }
    }
    case 'DEVELOPER_MODE_OFF': {
      return { ...state, developerModeOn: false }
    }

    case 'UI/SETTINGS/TOGGLE_PIN_LOGIN_ENABLED': {
      const { pinLoginEnabled } = action.data
      return {
        ...state,
        pinLoginEnabled
      }
    }

    case 'UPDATE_EXISTING_TOKEN_SUCCESS': {
      const { tokenObj } = action.data
      const customTokenSettings = state.customTokens
      const newCustomTokenSettings = customTokenSettings.map(item => {
        if (item.currencyCode === tokenObj.currencyCode) return { ...item, ...tokenObj }
        return item
      })
      const updatedSettings = {
        ...state,
        [tokenObj.currencyCode]: {
          ...state[tokenObj.currencyCode],
          ...tokenObj
        },
        customTokens: newCustomTokenSettings
      }
      return updatedSettings
    }

    case 'OVERWRITE_THEN_DELETE_TOKEN_SUCCESS': {
      // where oldCurrencyCode is the sender, and tokenObj.currencyCode is the receiver (new code)
      const receiverCode = action.data.tokenObj.currencyCode
      const senderCode = action.data.oldCurrencyCode
      const { tokenObj } = action.data
      const customTokenSettings = state.customTokens
      const tokenSettingsWithUpdatedToken = customTokenSettings.map(item => {
        // overwrite receiver token
        if (item.currencyCode === receiverCode) return { ...item, ...tokenObj, isVisible: true }
        return item
      })
      const tokenSettingsWithUpdatedAndDeleted = tokenSettingsWithUpdatedToken.map(item => {
        // make sender token invisible
        if (item.currencyCode === senderCode) return { ...item, isVisible: false }
        return item
      })
      const updatedSettings = {
        ...state,
        [receiverCode]: {
          ...state[receiverCode],
          ...tokenObj,
          isVisible: true
        },
        [senderCode]: {
          ...state[senderCode],
          isVisible: false
        },
        customTokens: tokenSettingsWithUpdatedAndDeleted
      }
      return updatedSettings
    }

    case 'DELETE_CUSTOM_TOKEN_SUCCESS': {
      const { currencyCode } = action.data
      const customTokenSettings = state.customTokens
      const newCustomTokenSettings = customTokenSettings.map(item => {
        if (item.currencyCode === currencyCode) return { ...item, isVisible: false }
        return item
      })
      return {
        ...state,
        [currencyCode]: {
          ...state[currencyCode],
          isVisible: false
        },
        customTokens: newCustomTokenSettings
      }
    }

    case 'ADD_NEW_CUSTOM_TOKEN_SUCCESS': {
      const { tokenObj, settings } = action.data
      const newCurrencyCode = tokenObj.currencyCode
      const customTokens = settings.customTokens
      return {
        ...state,
        [newCurrencyCode]: tokenObj,
        customTokens
      }
    }

    case 'ADD_NEW_TOKEN_THEN_DELETE_OLD_SUCCESS': {
      const { tokenObj, code, setSettings, oldCurrencyCode } = action.data
      const customTokens = setSettings.customTokens
      const oldCurrencyCodeIndex = customTokens.findIndex(item => item.currencyCode === oldCurrencyCode)
      customTokens[oldCurrencyCodeIndex] = {
        ...state.customTokens[oldCurrencyCodeIndex],
        isVisible: false
      }
      return {
        ...state,
        [code]: tokenObj,
        [oldCurrencyCode]: {
          ...state[oldCurrencyCode],
          isVisible: false
        },
        customTokens
      }
    }

    case 'UI/SETTINGS/SET_DENOMINATION_KEY': {
      const { pluginId, currencyCode, denomination } = action.data
      const newDenominationSettings = { ...state.denominationSettings }
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

export const settings = (state: SettingsState = initialState, action: Action) => {
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
