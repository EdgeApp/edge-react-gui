// @flow

import type { EdgeCurrencyPlugin } from 'edge-core-js'

import type { CustomTokenInfo, GuiTouchIdInfo } from '../../../types.js'

export const updateSettings = (settings: Object) => ({
  type: 'UI/Settings/UPDATE_SETTINGS',
  data: { settings }
})

export const loadSettings = (settings: Object) => ({
  type: 'UI/Settings/LOAD_SETTINGS',
  data: { settings }
})

export const setPINMode = (pinMode: boolean) => ({
  type: 'UI/Settings/SET_PIN_MODE',
  data: { pinMode }
})

export const setPIN = (pin: string | number) => ({
  type: 'UI/Settings/SET_PIN',
  data: { pin }
})

export const setOTPMode = (otpMode: boolean) => ({
  type: 'UI/Settings/SET_OTP_MODE',
  data: { otpMode }
})

export const setOTP = (otp: string) => ({
  type: 'UI/Settings/SET_OTP',
  data: { otp }
})

export const setAutoLogoutTimeInSeconds = (autoLogoutTimeInSeconds: number) => ({
  type: 'UI/Settings/SET_AUTO_LOGOUT_TIME',
  data: { autoLogoutTimeInSeconds }
})

export const setDefaultFiat = (defaultFiat: string) => ({
  type: 'UI/Settings/SET_DEFAULT_FIAT',
  data: { defaultFiat }
})

export const togglePinLoginEnabled = (pinLoginEnabled: boolean) => ({
  type: 'UI/Settings/TOGGLE_PIN_LOGIN_ENABLED',
  data: { pinLoginEnabled }
})

export const setMerchantMode = (merchantMode: boolean) => ({
  type: 'UI/Settings/SET_MERCHANT_MODE',
  data: { merchantMode }
})

export const setBluetoothMode = (bluetoothMode: boolean) => ({
  type: 'UI/Settings/SET_BLUETOOTH_MODE',
  data: { bluetoothMode }
})

// settings lock
export const setSettingsLock = (bool: boolean) => ({
  type: 'UI/Settings/SET_SETTINGS_LOCK',
  data: bool
})

// BTC Settings
export const setBitcoinOverrideServer = (overrideServer: string) => ({
  type: 'UI/Settings/SET_BITCOIN_OVERRIDE_SERVER',
  data: { overrideServer }
})

// Denomination
export const setDenominationKey = (currencyCode: string, denominationKey: string) => ({
  type: 'UI/Settings/SET_DENOMINATION_KEY',
  data: { currencyCode, denominationKey }
})

// Plugins
export const addCurrencyPlugin = (plugin: EdgeCurrencyPlugin) => ({
  type: 'UI/Settings/ADD_CURRENCY_PLUGIN',
  data: {
    pluginName: plugin.pluginName,
    plugin,
    walletTypes: plugin.currencyInfo.walletTypes
  }
})

// tokens
export const setCustomTokens = (customTokens: Array<CustomTokenInfo>) => ({
  type: 'UI/Settings/SET_CUSTOM_TOKENS',
  data: { customTokens }
})

// touch id settings
export const addTouchIdInfo = (touchIdInfo: GuiTouchIdInfo) => ({
  type: 'UI/Settings/TOUCH_ID_SETTINGS',
  data: touchIdInfo
})

export const updateTouchIdEnabled = (bool: boolean) => ({
  type: 'UI/Settings/CHANGE_TOUCH_ID_SETTINGS',
  data: { isTouchEnabled: bool }
})

export const updateOtpInfo = (otpInfo: { enabled: boolean, otpKey: ?string }) => ({
  type: 'UI/Settings/OTP_SETTINGS',
  data: otpInfo
})

export const setAccountBalanceVisibility = (isAccountBalanceVisible: boolean) => ({
  type: 'UI/Settings/SET_ACCOUNT_BALANCE_VISIBILITY',
  data: { isAccountBalanceVisible }
})

export const updateWalletFiatBalanceVisibility = (isWalletFiatBalanceVisible: boolean) => ({
  type: 'UPDATE_WALLET_FIAT_BALANCE_VISIBILITY',
  data: { isWalletFiatBalanceVisible }
})
