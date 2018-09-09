// @flow

import type { EdgeCurrencyInfo } from 'edge-core-js'
import _ from 'lodash'

import * as Constants from '../../../constants/indexConstants.js'
import type { CustomTokenInfo } from '../../../types.js'
import { CORE_DEFAULTS, LOCAL_ACCOUNT_DEFAULTS, SYNCED_ACCOUNT_DEFAULTS } from '../../Core/Account/settings.js'
import { SEND_LOGS_FAILURE, SEND_LOGS_PENDING, SEND_LOGS_REQUEST, SEND_LOGS_SUCCESS } from '../../Logs/action'
import type { Action } from '../../ReduxTypes.js'
import { UPDATE_SHOW_PASSWORD_RECOVERY_REMINDER_MODAL } from '../components/PasswordRecoveryReminderModal/PasswordRecoveryReminderModalActions.js'
import * as ADD_TOKEN_ACTION from '../scenes/AddToken/action.js'
import { SET_ENABLE_CUSTOM_NODES, UPDATE_CUSTOM_NODES_LIST } from '../scenes/Settings/action.js'
import * as WALLET_ACTION from '../Wallets/action'
import * as ACTION from './action.js'
import { spendingLimits } from './spendingLimits/SpendingLimitsReducer.js'

export const initialState = {
  ...SYNCED_ACCOUNT_DEFAULTS,
  ...LOCAL_ACCOUNT_DEFAULTS,
  ...CORE_DEFAULTS,
  changesLocked: true,
  plugins: {
    allCurrencyInfos: [],
    supportedWalletTypes: []
  },
  pinLoginEnabled: false,
  account: null,
  loginStatus: null,
  isTouchSupported: false,
  isTouchEnabled: false,
  isOtpEnabled: false,
  otpKey: null,
  otpResetDate: null,
  otpResetPending: false,
  confirmPasswordError: '',
  sendLogsStatus: Constants.REQUEST_STATUS.PENDING,
  isAccountBalanceVisible: true,
  isWalletFiatBalanceVisible: false,
  spendingLimits: {
    transaction: {
      isEnabled: false,
      amount: 0
    }
  }
}

export type CurrencySetting = {
  denomination: string,
  customNodes?: {
    nodesList?: Array<string>,
    isEnabled?: boolean
  }
}

export type SettingsState = {
  BCH: CurrencySetting,
  BTC: CurrencySetting,
  DASH: CurrencySetting,
  FTC: CurrencySetting,
  ETH: CurrencySetting,
  LTC: CurrencySetting,
  VTC: CurrencySetting,
  XZC: CurrencySetting,
  QTUM: CurrencySetting,
  UFO: CurrencySetting,
  XMR: CurrencySetting,
  XRP: CurrencySetting,
  REP: CurrencySetting,
  DOGE: CurrencySetting,
  DGB: CurrencySettings,
  WINGS: CurrencySetting,
  account: ?Object,
  autoLogoutTimeInSeconds: number,
  bluetoothMode: boolean,
  changesLocked: any,
  customTokens: Array<CustomTokenInfo>,
  defaultFiat: string,
  defaultIsoFiat: string,
  isOtpEnabled: boolean,
  isTouchEnabled: boolean,
  isTouchSupported: boolean,
  loginStatus: boolean | null,
  merchantMode: boolean,
  otpKey: string | null,
  otpResetPending: boolean,
  otpMode: boolean,
  pinMode: boolean,
  pinLoginEnabled: boolean,
  otpResetDate: ?string,
  plugins: {
    [pluginName: string]: EdgeCurrencyInfo,
    allCurrencyInfos: Array<EdgeCurrencyInfo>,
    supportedWalletTypes: Array<string>
  },
  confirmPasswordError: string,
  sendLogsStatus: string,
  isAccountBalanceVisible: boolean,
  isWalletFiatBalanceVisible: boolean,
  spendingLimits: {
    transaction: {
      isEnabled: boolean,
      amount: number
    }
  },
  passwordRecoveryRemindersShown: {
    '20': boolean,
    '200': boolean,
    '2000': boolean,
    '20000': boolean,
    '200000': boolean
  }
}

const currencyPLuginUtil = (state, payloadData) => {
  const { plugins } = state
  const { supportedWalletTypes } = plugins
  const { allCurrencyInfos } = plugins
  const { currencyInfo } = payloadData
  const { pluginName, walletTypes } = currencyInfo

  // Build up object with all the information for the parent currency, accesible by the currencyCode
  const defaultParentCurrencyInfo = state[currencyInfo.currencyCode]
  const parentCurrencyInfo = {
    [currencyInfo.currencyCode]: {
      ...defaultParentCurrencyInfo,
      currencyName: currencyInfo.currencyName,
      currencyCode: currencyInfo.currencyCode,
      denominations: currencyInfo.denominations,
      symbolImage: currencyInfo.symbolImage,
      symbolImageDarkMono: currencyInfo.symbolImageDarkMono
    }
  }

  // Build up object with all the information for each metatoken, accessible by the token currencyCode
  const metatokenCurrencyInfos = currencyInfo.metaTokens.reduce((acc, metatoken) => {
    const defaultMetatokenInfo = state[metatoken.currencyCode]
    return {
      ...acc,
      [metatoken.currencyCode]: {
        ...defaultMetatokenInfo,
        currencyName: metatoken.currencyName,
        currencyCode: metatoken.currencyCode,
        denominations: metatoken.denominations,
        symbolImage: metatoken.symbolImage,
        symbolImageDarkMono: metatoken.symbolImageDarkMono
      }
    }
  }, {})

  // Build up object with all the currency information for each currency supported by the plugin, accessible by the currencyCode
  const currencyInfos = {
    ...parentCurrencyInfo,
    ...metatokenCurrencyInfos
  }

  return {
    ...state,
    ...currencyInfos,
    plugins: {
      ...plugins,
      [pluginName]: currencyInfo,
      allCurrencyInfos: [...allCurrencyInfos, currencyInfo],
      supportedWalletTypes: [...supportedWalletTypes, ...walletTypes]
    }
  }
}

export const settingsLegacy = (state: SettingsState = initialState, action: Action) => {
  const { type, data = {} } = action

  switch (type) {
    case Constants.ACCOUNT_INIT_COMPLETE: {
      const {
        touchIdInfo,
        account,
        otpInfo,
        currencyPlugins,
        autoLogoutTimeInSeconds,
        defaultFiat,
        merchantMode,
        customTokens,
        bluetoothMode,
        pinMode,
        pinLoginEnabled,
        otpMode,
        denominationKeys,
        customTokensSettings,
        isAccountBalanceVisible,
        isWalletFiatBalanceVisible,
        passwordRecoveryRemindersShown
      } = data
      let newState = {
        ...state,
        loginStatus: true,
        isOtpEnabled: otpInfo.enabled,
        otpKey: otpInfo.otpKey,
        otpResetPending: otpInfo.otpResetPending,
        autoLogoutTimeInSeconds,
        isTouchEnabled: touchIdInfo ? touchIdInfo.isTouchEnabled : false,
        isTouchSupported: touchIdInfo ? touchIdInfo.isTouchSupported : false,
        defaultFiat,
        merchantMode,
        customTokens,
        bluetoothMode,
        pinMode,
        pinLoginEnabled,
        otpMode,
        otpResetDate: account.otpResetDate,
        isAccountBalanceVisible,
        isWalletFiatBalanceVisible,
        passwordRecoveryRemindersShown
      }
      denominationKeys.forEach(key => {
        const currencyCode = key.currencyCode
        const denomination = key.denominationKey
        const currencyState = newState[currencyCode]
        newState = {
          ...newState,
          [currencyCode]: {
            ...currencyState,
            denomination
          }
        }
      })
      currencyPlugins.forEach(key => {
        newState = currencyPLuginUtil(newState, key)
      })
      customTokensSettings.forEach(key => {
        const { currencyCode } = key
        newState = {
          ...newState,
          [currencyCode]: key,
          defaultIsoFiat: `iso:${defaultFiat}`
        }
      })
      return newState
    }
    case Constants.SET_CONFIRM_PASSWORD_ERROR: {
      const { confirmPasswordError } = data
      return { ...state, confirmPasswordError: confirmPasswordError }
    }
    case ACTION.SET_LOGIN_STATUS: {
      const { loginStatus } = data
      return {
        ...state,
        loginStatus
      }
    }

    case ACTION.TOGGLE_PIN_LOGIN_ENABLED: {
      const { pinLoginEnabled } = data
      return {
        ...state,
        pinLoginEnabled
      }
    }

    case ACTION.SET_CUSTOM_TOKENS: {
      const { customTokens } = data
      return {
        ...state,
        customTokens
      }
    }

    case WALLET_ACTION.UPDATE_EXISTING_TOKEN_SUCCESS: {
      const { tokenObj } = data
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

    case WALLET_ACTION.OVERWRITE_THEN_DELETE_TOKEN_SUCCESS: {
      // where oldCurrencyCode is the sender, and tokenObj.currencyCode is the receiver (new code)
      const receiverCode = data.tokenObj.currencyCode
      const senderCode = data.oldCurrencyCode
      const { tokenObj } = data
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

    case WALLET_ACTION.DELETE_CUSTOM_TOKEN_SUCCESS: {
      const { currencyCode } = data
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

    case ADD_TOKEN_ACTION.SET_TOKEN_SETTINGS: {
      const { currencyCode } = data
      return {
        ...state,
        [currencyCode]: data
      }
    }

    case ADD_TOKEN_ACTION.ADD_NEW_CUSTOM_TOKEN_SUCCESS: {
      const { tokenObj, newCurrencyCode, settings } = data
      const customTokens = settings.customTokens
      return {
        ...state,
        [newCurrencyCode]: tokenObj,
        customTokens
      }
    }

    case WALLET_ACTION.ADD_NEW_TOKEN_THEN_DELETE_OLD_SUCCESS: {
      const { tokenObj, code, setSettings, oldCurrencyCode } = data
      const customTokens = setSettings.customTokens
      const oldCurrencyCodeIndex = _.findIndex(customTokens, item => item.currencyCode === oldCurrencyCode)
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

    case ACTION.SET_DENOMINATION_KEY: {
      const currencyCode = data.currencyCode
      const denomination = data.denominationKey
      const currencyState = state[currencyCode]
      return {
        ...state,
        [currencyCode]: {
          ...currencyState,
          denomination
        }
      }
    }
    case Constants.DISABLE_OTP_RESET: {
      return {
        ...state,
        otpResetDate: null,
        otpResetPending: false
      }
    }
    case ACTION.UPDATE_SETTINGS: {
      const { settings } = data
      return settings
    }

    case ACTION.LOAD_SETTINGS: {
      const { settings } = data
      return settings
    }

    case ACTION.SET_PIN_MODE: {
      const { pinMode } = data
      return {
        ...state,
        pinMode
      }
    }

    case ACTION.SET_OTP_MODE: {
      const { otpMode } = data
      return {
        ...state,
        otpMode
      }
    }

    case ACTION.SET_AUTO_LOGOUT_TIME: {
      const { autoLogoutTimeInSeconds } = data
      return {
        ...state,
        autoLogoutTimeInSeconds
      }
    }

    case SEND_LOGS_REQUEST: {
      return {
        ...state,
        sendLogsStatus: Constants.REQUEST_STATUS.LOADING
      }
    }
    case SEND_LOGS_FAILURE:
      return {
        ...state,
        sendLogsStatus: Constants.REQUEST_STATUS.FAILURE
      }

    case SEND_LOGS_SUCCESS:
      return {
        ...state,
        sendLogsStatus: Constants.REQUEST_STATUS.SUCCESS
      }
    case SEND_LOGS_PENDING:
      return {
        ...state,
        sendLogsStatus: Constants.REQUEST_STATUS.PENDING
      }

    case ACTION.SET_DEFAULT_FIAT: {
      const { defaultFiat } = data
      return {
        ...state,
        defaultFiat,
        defaultIsoFiat: `iso:${defaultFiat}`
      }
    }

    case ACTION.SET_MERCHANT_MODE: {
      const { merchantMode } = data
      return {
        ...state,
        merchantMode
      }
    }

    case ACTION.SET_BLUETOOTH_MODE: {
      const { bluetoothMode } = data
      return {
        ...state,
        bluetoothMode
      }
    }

    case ACTION.SET_BITCOIN_OVERRIDE_SERVER: {
      const { overrideServer } = data
      const BTC = state['BTC']
      return {
        ...state,
        BTC: {
          ...BTC,
          overrideServer
        }
      }
    }

    case ACTION.SET_SETTINGS_LOCK: {
      return {
        ...state,
        changesLocked: data
      }
    }

    case ACTION.OTP_SETTINGS: {
      return {
        ...state,
        isOtpEnabled: data.enabled,
        otpKey: data.otpKey,
        otpResetPending: data.otpResetPending
      }
    }

    case ACTION.TOUCH_ID_SETTINGS: {
      if (data) {
        return {
          ...state,
          isTouchSupported: data.isTouchSupported,
          isTouchEnabled: data.isTouchEnabled
        }
      } else {
        return {
          ...state,
          isTouchSupported: false,
          isTouchEnabled: false
        }
      }
    }

    case ACTION.CHANGE_TOUCH_ID_SETTINGS: {
      return {
        ...state,
        isTouchEnabled: data.isTouchEnabled
      }
    }

    case SET_ENABLE_CUSTOM_NODES: {
      const { isEnabled } = data
      const updatedSettings = {
        ...state,
        [data.currencyCode]: {
          ...state[data.currencyCode],
          customNodes: {
            ...state[data.currencyCode].customNodes,
            isEnabled
          }
        }
      }
      return updatedSettings
    }

    case UPDATE_CUSTOM_NODES_LIST: {
      const nodesList = data.nodesList
      const updatedSettings = {
        ...state,
        [data.currencyCode]: {
          ...state[data.currencyCode],
          customNodes: {
            ...state[data.currencyCode].customNodes,
            nodesList
          }
        }
      }
      return updatedSettings
    }

    case ACTION.ADD_CURRENCY_PLUGIN: {
      return currencyPLuginUtil(state, data)
    }

    case ACTION.SET_ACCOUNT_BALANCE_VISIBILITY: {
      return {
        ...state,
        isAccountBalanceVisible: data.isAccountBalanceVisible
      }
    }

    case ACTION.UPDATE_WALLET_FIAT_BALANCE_VISIBILITY: {
      return {
        ...state,
        isWalletFiatBalanceVisible: data.isWalletFiatBalanceVisible
      }
    }

    case UPDATE_SHOW_PASSWORD_RECOVERY_REMINDER_MODAL: {
      const { level, wasShown } = data
      return {
        ...state,
        passwordRecoveryRemindersShown: {
          ...state.passwordRecoveryRemindersShown,
          [level]: wasShown
        }
      }
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
