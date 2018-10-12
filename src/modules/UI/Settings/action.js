// @flow

import type { EdgeCurrencyPlugin } from 'edge-core-js'

import type { CustomTokenInfo, GuiTouchIdInfo } from '../../../types.js'

export const updateSettings = (settings: Object) => ({
  type: 'UI/SETTINGS/UPDATE_SETTINGS',
  data: { settings }
})

export const loadSettings = (settings: Object) => ({
  type: 'UI/SETTINGS/LOAD_SETTINGS',
  data: { settings }
})

export const setPINMode = (pinMode: boolean) => ({
  type: 'UI/SETTINGS/SET_PIN_MODE',
  data: { pinMode }
})

export const setPIN = (pin: string | number) => ({
  type: 'UI/SETTINGS/SET_PIN',
  data: { pin }
})

export const setOTPMode = (otpMode: boolean) => ({
  type: 'UI/SETTINGS/SET_OTP_MODE',
  data: { otpMode }
})

export const setOTP = (otp: string) => ({
  type: 'UI/SETTINGS/SET_OTP',
  data: { otp }
})

export const setAutoLogoutTimeInSeconds = (autoLogoutTimeInSeconds: number) => ({
  type: 'UI/SETTINGS/SET_AUTO_LOGOUT_TIME',
  data: { autoLogoutTimeInSeconds }
})

export const setDefaultFiat = (defaultFiat: string) => ({
  type: 'UI/SETTINGS/SET_DEFAULT_FIAT',
  data: { defaultFiat }
})

export const togglePinLoginEnabled = (pinLoginEnabled: boolean) => ({
  type: 'UI/SETTINGS/TOGGLE_PIN_LOGIN_ENABLED',
  data: { pinLoginEnabled }
})

export const setMerchantMode = (merchantMode: boolean) => ({
  type: 'UI/SETTINGS/SET_MERCHANT_MODE',
  data: { merchantMode }
})

export const setBluetoothMode = (bluetoothMode: boolean) => ({
  type: 'UI/SETTINGS/SET_BLUETOOTH_MODE',
  data: { bluetoothMode }
})

// settings lock
export const setSettingsLock = (bool: boolean) => ({
  type: 'UI/SETTINGS/SET_SETTINGS_LOCK',
  data: bool
})

// Denomination
export const setDenominationKey = (currencyCode: string, denominationKey: string) => ({
  type: 'UI/SETTINGS/SET_DENOMINATION_KEY',
  data: { currencyCode, denominationKey }
})

// Plugins
export const addCurrencyPlugin = (plugin: EdgeCurrencyPlugin) => ({
  type: 'UI/SETTINGS/ADD_CURRENCY_PLUGIN',
  data: {
    pluginName: plugin.pluginName,
    plugin,
    walletTypes: plugin.currencyInfo.walletTypes
  }
})

// tokens
export const setCustomTokens = (customTokens: Array<CustomTokenInfo>) => ({
  type: 'UI/SETTINGS/SET_CUSTOM_TOKENS',
  data: { customTokens }
})

// touch id settings
export const addTouchIdInfo = (touchIdInfo: GuiTouchIdInfo) => ({
  type: 'UI/SETTINGS/TOUCH_ID_SETTINGS',
  data: touchIdInfo
})

export const updateTouchIdEnabled = (bool: boolean) => ({
  type: 'UI/SETTINGS/CHANGE_TOUCH_ID_SETTINGS',
  data: { isTouchEnabled: bool }
})

export const updateOtpInfo = (otpInfo: { enabled: boolean, otpKey: ?string }) => ({
  type: 'UI/SETTINGS/OTP_SETTINGS',
  data: otpInfo
})

export const setAccountBalanceVisibility = (isAccountBalanceVisible: boolean) => ({
  type: 'UI/SETTINGS/SET_ACCOUNT_BALANCE_VISIBILITY',
  data: { isAccountBalanceVisible }
})

export const updateWalletFiatBalanceVisibility = (isWalletFiatBalanceVisible: boolean) => ({
  type: 'UPDATE_WALLET_FIAT_BALANCE_VISIBILITY',
  data: { isWalletFiatBalanceVisible }
})
