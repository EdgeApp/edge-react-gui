// @flow

import type { JsonObject } from 'edge-core-js'

import type { SortOption } from '../../components/modals/WalletListSortModal.js'
import type { FeeOption } from '../../reducers/scenes/SettingsReducer.js'
import type { MostRecentWallet } from '../../types/types.js'

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

// Default fee
export const setDefaultFee = (currencyCode: string, defaultFee: FeeOption, customFee: JsonObject) => ({
  type: 'UI/SETTINGS/SET_DEFAULT_FEE',
  data: { currencyCode: currencyCode, defaultFee: defaultFee, customFee: customFee }
})

// touch id settings
export const updateTouchIdEnabled = (bool: boolean) => ({
  type: 'UI/SETTINGS/CHANGE_TOUCH_ID_SETTINGS',
  data: { isTouchEnabled: bool }
})

export const setAccountBalanceVisibility = (isAccountBalanceVisible: boolean) => ({
  type: 'UI/SETTINGS/SET_ACCOUNT_BALANCE_VISIBILITY',
  data: { isAccountBalanceVisible }
})

export const setWalletsSort = (walletsSort: SortOption) => {
  console.log(walletsSort)
  return {
    type: 'UI/SETTINGS/SET_WALLETS_SORT',
    data: { walletsSort }
  }
}

export const updateMostRecentWallets = (mostRecentWallets: MostRecentWallet[]) => ({
  type: 'UI/SETTINGS/SET_MOST_RECENT_WALLETS',
  data: { mostRecentWallets }
})
