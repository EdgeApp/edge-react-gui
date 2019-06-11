// @flow

import type { EdgeAccount } from 'edge-core-js'

import type { PasswordReminder } from '../../../types.js'
import { categories } from './subcategories.js'

// Default Core Settings
export const CORE_DEFAULTS = {
  otpMode: false,
  pinMode: false
}

export const PASSWORD_RECOVERY_REMINDERS_SHOWN = {
  '20': false,
  '200': false,
  '2000': false,
  '20000': false,
  '200000': false
}

// TODO:  Remove hardcoded currency defaults
// Default Account Settings
export const SYNCED_ACCOUNT_DEFAULTS = {
  autoLogoutTimeInSeconds: 3600,
  defaultFiat: 'USD',
  defaultIsoFiat: 'iso:USD',
  merchantMode: false,
  BTC: {
    denomination: '100'
  },
  BCH: {
    denomination: '100'
  },
  EOS: {
    denomination: '10000'
  },
  XRP: {
    denomination: '1000000'
  },
  XLM: {
    denomination: '10000000'
  },
  DASH: {
    denomination: '100000000'
  },
  DOGE: {
    denomination: '100000000'
  },
  DGB: {
    denomination: '100000000'
  },
  LTC: {
    denomination: '100000000'
  },
  FTC: {
    denomination: '100000000'
  },
  VTC: {
    denomination: '100000000'
  },
  // RVN: {
  //   denomination: '100000000'
  // },
  XZC: {
    denomination: '100000000'
  },
  QTUM: {
    denomination: '100000000'
  },
  XMR: {
    denomination: '1000000000000'
  },
  ETH: {
    denomination: '1000000000000000000'
  },
  UFO: {
    denomination: '100000000'
  },
  REP: {
    denomination: '1000000000000000000'
  },
  WINGS: {
    denomination: '1000000000000000000'
  },
  IND: {
    denomination: '1000000000000000000'
  },
  HUR: {
    denomination: '1000000000000000000'
  },
  SMART: {
    denomination: '100000000'
  },
  HERC: {
    denomination: '1000000000000000000'
  },
  ANT: {
    denomination: '1000000000000000000'
  },
  BAT: {
    denomination: '1000000000000000000'
  },
  BNT: {
    denomination: '1000000000000000000'
  },
  GNT: {
    denomination: '1000000000000000000'
  },
  KNC: {
    denomination: '1000000000000000000'
  },
  POLY: {
    denomination: '1000000000000000000'
  },
  STORJ: {
    denomination: '100000000'
  },
  USDC: {
    denomination: '1000000'
  },
  USDS: {
    denomination: '1000000'
  },
  TUSD: {
    denomination: '1000000000000000000'
  },
  ZRX: {
    denomination: '1000000000000000000'
  },
  GNO: {
    denomination: '1000000000000000000'
  },
  OMG: {
    denomination: '1000000000000000000'
  },
  NMR: {
    denomination: '1000000000000000000'
  },
  BNB: {
    denomination: '1000000000000000000'
  },
  MKR: {
    denomination: '1000000000000000000'
  },
  GUSD: {
    denomination: '100'
  },
  PAX: {
    denomination: '1000000000000000000'
  },
  SALT: {
    denomination: '100000000'
  },
  MANA: {
    denomination: '1000000000000000000'
  },
  NEXO: {
    denomination: '1000000000000000000'
  },
  FUN: {
    denomination: '100000000'
  },
  KIN: {
    denomination: '1000000000000000000'
  },
  USDT: {
    denomination: '1000000'
  },
  DAI: {
    denomination: '1000000000000000000'
  },
  BRZ: {
    denomination: '10000'
  },
  customTokens: [],
  passwordRecoveryRemindersShown: PASSWORD_RECOVERY_REMINDERS_SHOWN
}

export const SYNCED_ACCOUNT_TYPES = {
  autoLogoutTimeInSeconds: 'number',
  defaultFiat: 'string',
  defaultIsoFiat: 'string',
  merchantMode: 'boolean',
  BTC: 'object',
  BCH: 'object',
  EOS: 'object',
  XRP: 'object',
  XLM: 'object',
  DASH: 'object',
  DOGE: 'object',
  DGB: 'object',
  LTC: 'object',
  FTC: 'object',
  VTC: 'object',
  RVN: 'object',
  XZC: 'object',
  QTUM: 'object',
  XMR: 'object',
  ETH: 'object',
  UFO: 'object',
  REP: 'object',
  WINGS: 'object',
  IND: 'object',
  HUR: 'object',
  HERC: 'object',
  SMART: 'object',
  ANT: 'object',
  BAT: 'object',
  BNT: 'object',
  GNT: 'object',
  KNC: 'object',
  POLY: 'object',
  STORJ: 'object',
  USDC: 'object',
  BRZ: 'object',
  USDS: 'object',
  TUSD: 'object',
  ZRX: 'object',
  GNO: 'object',
  OMG: 'object',
  NMR: 'object',
  BNB: 'object',
  MKR: 'object',
  GUSD: 'object',
  PAX: 'object',
  SALT: 'object',
  MANA: 'object',
  NEXO: 'object',
  FUN: 'object',
  KIN: 'object',
  USDT: 'object',
  DAI: 'object',
  customTokens: 'object', // arrays return 'object' to typeof
  passwordRecoveryRemindersShown: 'object'
}

export const LOCAL_ACCOUNT_DEFAULTS = {
  bluetoothMode: false,
  passwordReminder: {
    needsPasswordCheck: false,
    lastPasswordUseDate: 0,
    passwordUseCount: 0,
    nonPasswordLoginsCount: 0,
    nonPasswordDaysLimit: 4,
    nonPasswordLoginsLimit: 4
  },
  isAccountBalanceVisible: true,
  isWalletFiatBalanceVisible: false,
  spendingLimits: {
    transaction: {
      amount: 0,
      isEnabled: false
    }
  }
}

export const LOCAL_ACCOUNT_TYPES = {
  bluetoothMode: 'boolean',
  passwordReminder: 'object',
  isAccountBalanceVisible: 'boolean',
  isWalletFiatBalanceVisible: 'boolean',
  spendingLimits: 'object'
}

const SYNCED_SETTINGS_FILENAME = 'Settings.json'
const LOCAL_SETTINGS_FILENAME = 'Settings.json'
const CATEGORIES_FILENAME = 'Categories.json'

//  Settings
// Core Settings

export const setPINModeRequest = (account: EdgeAccount, pinMode: boolean) =>
  pinMode // $FlowFixMe enablePIN not found on EdgeAccount type
    ? account.enablePIN() // $FlowFixMe isablePIN not found on EdgeAccount type
    : account.disablePIN()

export const setPINRequest = (account: EdgeAccount, pin: string) => account.changePin({ pin })

// Account Settings
export const setAutoLogoutTimeInSecondsRequest = (account: EdgeAccount, autoLogoutTimeInSeconds: number) =>
  getSyncedSettings(account).then(settings => {
    const updatedSettings = updateSettings(settings, { autoLogoutTimeInSeconds })
    return setSyncedSettings(account, updatedSettings)
  })

export const setDefaultFiatRequest = (account: EdgeAccount, defaultFiat: string) =>
  getSyncedSettings(account).then(settings => {
    const updatedSettings = updateSettings(settings, { defaultFiat, defaultIsoFiat: `iso:${defaultFiat}` })
    return setSyncedSettings(account, updatedSettings)
  })

export const setMerchantModeRequest = (account: EdgeAccount, merchantMode: boolean) =>
  getSyncedSettings(account).then(settings => {
    const updatedSettings = updateSettings(settings, { merchantMode })
    return setSyncedSettings(account, updatedSettings)
  })

// Local Settings
export const setBluetoothModeRequest = (account: EdgeAccount, bluetoothMode: boolean) =>
  getLocalSettings(account).then(settings => {
    const updatedSettings = updateSettings(settings, { bluetoothMode })
    return setLocalSettings(account, updatedSettings)
  })

export const setPasswordReminderRequest = (account: EdgeAccount, passwordReminder: PasswordReminder) =>
  getLocalSettings(account).then(settings => {
    const updatedSettings = updateSettings(settings, { passwordReminder })
    return setLocalSettings(account, updatedSettings)
  })

export const setAccountBalanceVisibility = (account: EdgeAccount, isAccountBalanceVisible: boolean) => {
  return getLocalSettings(account).then(settings => {
    const updatedSettings = updateSettings(settings, { isAccountBalanceVisible })
    return setLocalSettings(account, updatedSettings)
  })
}

export const setWalletFiatBalanceVisibility = (account: EdgeAccount, isWalletFiatBalanceVisible: boolean) => {
  return getLocalSettings(account).then(settings => {
    const updatedSettings = updateSettings(settings, { isWalletFiatBalanceVisible })
    return setLocalSettings(account, updatedSettings)
  })
}

export type SpendingLimits = {
  transaction: {
    amount: number,
    isEnabled: boolean
  }
}

export const setSpendingLimits = (account: EdgeAccount, spendingLimits: SpendingLimits) => {
  return getLocalSettings(account).then(settings => {
    const updatedSettings = updateSettings(settings, { spendingLimits })
    return setLocalSettings(account, updatedSettings)
  })
}
export async function setPasswordRecoveryRemindersAsync (account: EdgeAccount, level: string, wasShown: boolean) {
  const settings = await getSyncedSettings(account)
  const passwordRecoveryRemindersShown = {
    ...settings.passwordRecoveryRemindersShown,
    [level]: wasShown
  }
  const updatedSettings = updateSettings(settings, { passwordRecoveryRemindersShown })
  return setSyncedSettings(account, updatedSettings)
}

// Currency Settings
export const setDenominationKeyRequest = (account: EdgeAccount, currencyCode: string, denomination: string) =>
  getSyncedSettings(account).then(settings => {
    const updatedSettings = updateCurrencySettings(settings, currencyCode, { denomination })
    return setSyncedSettings(account, updatedSettings)
  })

// Helper Functions
export const getSyncedSettings = (account: EdgeAccount) =>
  account.disklet
    .getText(SYNCED_SETTINGS_FILENAME)
    .then(text => {
      const settingsFromFile = JSON.parse(text)
      return settingsFromFile
    })
    .catch(e => {
      console.log(e)
      // If Settings.json doesn't exist yet, create it, and return it
      return setSyncedSettings(account, SYNCED_ACCOUNT_DEFAULTS)
    })

export async function getSyncedSettingsAsync (account: EdgeAccount): Promise<any> {
  try {
    const text = await account.disklet.getText(SYNCED_SETTINGS_FILENAME)
    const settingsFromFile = JSON.parse(text)
    return settingsFromFile
  } catch (e) {
    console.log(e)
    // If Settings.json doesn't exist yet, create it, and return it
    return setSyncedSettings(account, SYNCED_ACCOUNT_DEFAULTS)
  }
}

export const setSyncedSettings = (account: EdgeAccount, settings: Object) => {
  const text = JSON.stringify(settings)
  account.disklet.setText(SYNCED_SETTINGS_FILENAME, text)
}

export async function setSyncedSettingsAsync (account: EdgeAccount, settings: Object) {
  const text = JSON.stringify(settings)
  await account.disklet.setText(SYNCED_SETTINGS_FILENAME, text)
}

export type CategoriesFile = { categories: Array<string> }

export async function setSubcategoriesRequest (account: EdgeAccount, subcategories: CategoriesFile) {
  // const subcats = await getSyncedSubcategories(account)
  return setSyncedSubcategories(account, subcategories)
}

export async function setSyncedSubcategories (account: EdgeAccount, subcategories: CategoriesFile) {
  let finalText = {}
  if (!subcategories.categories) {
    finalText.categories = subcategories
  } else {
    finalText = subcategories
  }
  const stringifiedSubcategories = JSON.stringify(finalText)
  try {
    await account.disklet.setText(CATEGORIES_FILENAME, stringifiedSubcategories)
  } catch (e) {
    console.log(e)
  }
}

export const getSyncedSubcategories = (account: EdgeAccount) =>
  account.disklet
    .getText(CATEGORIES_FILENAME)
    .then(text => {
      const categoriesText = JSON.parse(text)
      return categoriesText.categories
    })
    .catch(() =>
      // If Categories.json doesn't exist yet, create it, and return it
      setSyncedSubcategories(account, SYNCED_SUBCATEGORIES_DEFAULTS).then(() => SYNCED_SUBCATEGORIES_DEFAULTS.categories)
    )

export const getLocalSettings = (account: EdgeAccount) => {
  return account.localDisklet
    .getText(LOCAL_SETTINGS_FILENAME)
    .then(JSON.parse)
    .catch(() => {
      // If Settings.json doesn't exist yet, create it, and return it
      return setLocalSettings(account, LOCAL_ACCOUNT_DEFAULTS).then(() => LOCAL_ACCOUNT_DEFAULTS)
    })
    .then(settings => {
      return {
        ...LOCAL_ACCOUNT_DEFAULTS,
        ...settings
      }
    })
}

export const setLocalSettings = (account: EdgeAccount, settings: Object) => {
  const text = JSON.stringify(settings)
  return account.localDisklet.setText(LOCAL_SETTINGS_FILENAME, text)
}

export const getCoreSettings = (account: EdgeAccount): Promise<{ otpMode: boolean, pinMode: boolean }> => {
  // eslint-disable-line no-unused-vars
  const coreSettings: { otpMode: boolean, pinMode: boolean } = CORE_DEFAULTS
  // TODO: Get each setting separately,
  // build up settings object,
  // return settings object
  return Promise.resolve(coreSettings)
}

export const updateCurrencySettings = (currentSettings: Object, currencyCode: string, newSettings: Object) => {
  const currencySettings = currentSettings[currencyCode]
  // update with new settings
  const updatedSettings = {
    ...currentSettings,
    [currencyCode]: {
      ...currencySettings,
      ...newSettings
    }
  }
  return updatedSettings
}

export const updateSettings = (currentSettings: Object, newSettings: Object) => {
  // update with new settings
  const updatedSettings = {
    ...currentSettings,
    ...newSettings
  }
  return updatedSettings
}

export const SYNCED_SUBCATEGORIES_DEFAULTS = {
  categories: categories
}
