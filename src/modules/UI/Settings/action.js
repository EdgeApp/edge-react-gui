// @flow

import * as SETTINGS_SELECTORS from './selectors'

import type {Dispatch, GetState} from '../../ReduxTypes'

// UI/Settings
const PREFIX = 'UI/Settings/'

export const SET_LOGIN_STATUS = PREFIX + 'SET_LOGIN_STATUS'

export const ADD_EXCHANGE_TIMER = PREFIX + 'ADD_EXCHANGE_TIMER'

export const UPDATE_SETTINGS = PREFIX + 'UPDATE_SETTINGS'
export const LOAD_SETTINGS = PREFIX + 'LOAD_SETTINGS'
export const TOUCH_ID_SETTINGS = PREFIX + 'TOUCH_ID_SETTINGS'
export const CHANGE_TOUCH_ID_SETTINGS = PREFIX + 'CHANGE_TOUCH_ID_SETTINGS'

// Core Settings
export const SET_PIN_MODE = PREFIX + 'SET_PIN_MODE'
export const SET_PIN = PREFIX + 'SET_PIN'
export const SET_OTP_MODE = PREFIX + 'SET_OTP_MODE'
export const SET_OTP = PREFIX + 'SET_OTP'

// Synced Account Settings
export const SET_AUTO_LOGOUT_TIME = PREFIX + 'SET_AUTO_LOGOUT_TIME'
export const SET_DEFAULT_FIAT = PREFIX + 'SET_DEFAULT_FIAT'
export const SET_MERCHANT_MODE = PREFIX + 'SET_MERCHANT_MODE'

// Lock account
export const SET_SETTINGS_LOCK = PREFIX + 'SET_SETTINGS_LOCK'

// Local Account Settings
export const SET_BLUETOOTH_MODE = PREFIX + 'SET_BLUETOOTH_MODE'

// Currency Settings
export const SET_BITCOIN_OVERRIDE_SERVER = PREFIX + 'SET_BITCOIN_OVERRIDE_SERVER'

// Denomination
export const SET_DENOMINATION_KEY = PREFIX + 'SET_DENOMINATION_KEY'

// Plugins
export const ADD_CURRENCY_PLUGIN = PREFIX + 'ADD_CURRENCY_PLUGIN'

// tokens
export const SET_CUSTOM_TOKENS = PREFIX + 'SET_CUSTOM_TOKENS'

export const UPDATE_TRANSACTION_SPENDING_LIMIT_START   = PREFIX + 'UPDATE_TRANSACTION_SPENDING_LIMIT_START'
export const UPDATE_TRANSACTION_SPENDING_LIMIT_SUCCESS = PREFIX + 'UPDATE_TRANSACTION_SPENDING_LIMIT_SUCCESS'
export const UPDATE_TRANSACTION_SPENDING_LIMIT_ERROR   = PREFIX + 'UPDATE_TRANSACTION_SPENDING_LIMIT_ERROR'
export const UPDATE_DAILY_SPENDING_LIMIT_START   = PREFIX + 'UPDATE_DAILY_SPENDING_LIMIT_START'
export const UPDATE_DAILY_SPENDING_LIMIT_SUCCESS = PREFIX + 'UPDATE_DAILY_SPENDING_LIMIT_SUCCESS'
export const UPDATE_DAILY_SPENDING_LIMIT_ERROR   = PREFIX + 'UPDATE_DAILY_SPENDING_LIMIT_ERROR'

export const LOAD_CURRENCY_SETTINGS = PREFIX + 'LOAD_CURRENCY_SETTINGS'

export const setLoginStatus = (loginStatus: boolean) => ({
  type: SET_LOGIN_STATUS,
  data: {loginStatus}
})

export const addExchangeTimer = () => ({
  type: ADD_EXCHANGE_TIMER,
  data: {}
})

export const removeExchangeTimer = () => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const exchangeTimer = SETTINGS_SELECTORS.getExchangeTimer(state)
  clearInterval(exchangeTimer)

  return {
    type: 'REMOVE_EXCHANGE_TIMER'
  }
}

export const updateSettings = (settings: Object) => ({
  type: UPDATE_SETTINGS,
  data: {settings}
})

export const loadSettings = (settings: Object) => ({
  type: LOAD_SETTINGS,
  data: {settings}
})

export const setPINMode = (pinMode: boolean) => ({
  type: SET_PIN_MODE,
  data: {pinMode}
})

export const setPIN = (pin: string) => ({
  type: SET_PIN,
  data: {pin}
})

export const setOTPMode = (otpMode: boolean) => ({
  type: SET_OTP_MODE,
  data: {otpMode}
})

export const setOTP = (otp: string) => ({
  type: SET_OTP,
  data: {otp}
})

export const setAutoLogoutTimeInSeconds = (autoLogoutTimeInSeconds: number) => ({
  type: SET_AUTO_LOGOUT_TIME,
  data: {autoLogoutTimeInSeconds}
})

export const setDefaultFiat = (defaultFiat: string) => ({
  type: SET_DEFAULT_FIAT,
  data: {defaultFiat}
})

export const setMerchantMode = (merchantMode: boolean) => ({
  type: SET_MERCHANT_MODE,
  data: {merchantMode}
})

export const setBluetoothMode = (bluetoothMode: boolean) => ({
  type: SET_BLUETOOTH_MODE,
  data: {bluetoothMode}
})
// settings lock
export const setSettingsLock = (bool: boolean) => ({
  type: SET_SETTINGS_LOCK,
  data: bool
})
// BTC Settings
export const setBitcoinOverrideServer = (overrideServer: string) => ({
  type: SET_BITCOIN_OVERRIDE_SERVER,
  data: {overrideServer}
})

// Denomination
export const setDenominationKey = (currencyCode: string, denominationKey: string) => ({
  type: SET_DENOMINATION_KEY,
  data: {currencyCode, denominationKey}
})

// Plugins
export const addCurrencyPlugin = (plugin: Object) => {
  const pluginName = plugin.pluginName
  const walletTypes = plugin.currencyInfo.walletTypes
  return {
    type: ADD_CURRENCY_PLUGIN,
    data: {pluginName, plugin, walletTypes}
  }
}

// tokens

export const setCustomTokens = (customTokens: any) => {
  return {
    type: SET_CUSTOM_TOKENS,
    data: {customTokens}
  }
}

// touch id settings
export const addTouchIdInfo = (touchIdInfo: Object) => {
  return {
    type: TOUCH_ID_SETTINGS,
    data: touchIdInfo
  }
}

export const updateTouchIdEnabled = (bool: boolean) => {
  return {
    type: CHANGE_TOUCH_ID_SETTINGS,
    data: bool
  }
}

export const updateTransactionSpendingLimitStart = (currencyCode: string, isEnabled: boolean, nativeAmount: string) => ({
  type: UPDATE_TRANSACTION_SPENDING_LIMIT_START,
  data: {
    currencyCode,
    isEnabled,
    nativeAmount
  }
})

export const updateTransactionSpendingLimitSuccess = (currencyCode: string, isEnabled: boolean, nativeAmount: string) => ({
  type: UPDATE_TRANSACTION_SPENDING_LIMIT_SUCCESS,
  data: {
    currencyCode,
    isEnabled,
    nativeAmount
  }
})

export const updateTransactionSpendingLimitError = (error: Error) => ({
  type: UPDATE_TRANSACTION_SPENDING_LIMIT_ERROR,
  data: {error}
})

export const updateDailySpendingLimitStart = (currencyCode: string, isEnabled: boolean, nativeAmount: string) => ({
  type: UPDATE_DAILY_SPENDING_LIMIT_START,
  data: {
    currencyCode,
    isEnabled,
    nativeAmount
  }
})

export const updateDailySpendingLimitSuccess = (currencyCode: string, isEnabled: boolean, nativeAmount: string) => ({
  type: UPDATE_DAILY_SPENDING_LIMIT_SUCCESS,
  data: {
    currencyCode,
    isEnabled,
    nativeAmount
  }
})

export const updateDailySpendingLimitError = (error: Error) => ({
  type: UPDATE_DAILY_SPENDING_LIMIT_ERROR,
  data: {error}
})
