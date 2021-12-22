/* eslint-disable quote-props */
// @flow

import type { EdgeAccount } from 'edge-core-js'

import type { SortOption } from '../../../components/modals/WalletListSortModal.js'
import { showError } from '../../../components/services/AirshipInstance.js'
import type { MostRecentWallet, PasswordReminder } from '../../../types/types.js'
import { categories } from './subcategories.js'

// prettier-ignore
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
  preferredSwapPluginId: '',
  countryCode: '',
  BTC: {
    denomination: '100000000'
  },
  ZADDR: {
    denomination: '100000000',
    denominations: [
      {
        multiplier: '100000000',
        name: 'ZEC',
        symbol: 'ZEC'
      }
    ]
  },
  TESTBTC: {
    denomination: '100000000'
  },
  BCH: {
    denomination: '100000000'
  },
  EOS: {
    denomination: '10000'
  },
  TLOS: {
    denomination: '10000'
  },
  WAX: {
    denomination: '100000000'
  },
  XRP: {
    denomination: '1000000'
  },
  XLM: {
    denomination: '10000000'
  },
  BNB: {
    denomination: '100000000'
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
  RVN: {
    denomination: '100000000'
  },
  FIRO: {
    denomination: '100000000'
  },
  QTUM: {
    denomination: '100000000'
  },
  XMR: {
    denomination: '1000000000000'
  },
  XTZ: {
    denomination: '1000000'
  },
  ETH: {
    denomination: '1000000000000000000'
  },
  ETC: {
    denomination: '1000000000000000000'
  },
  UFO: {
    denomination: '100000000'
  },
  REP: {
    denomination: '1000000000000000000'
  },
  REPV2: {
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
  ANTV1: {
    denomination: '1000000000000000000'
  },
  HBAR: {
    denomination: '100000000'
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
  GLM: {
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
  SAI: {
    denomination: '1000000000000000000'
  },
  BRZ: {
    denomination: '10000'
  },
  LINK: {
    denomination: '1000000000000000000'
  },
  RBTC: {
    denomination: '1000000000000000000'
  },
  RIF: {
    denomination: '1000000000000000000'
  },
  CREP: {
    denomination: '100000000'
  },
  CUSDC: {
    denomination: '100000000'
  },
  CBAT: {
    denomination: '100000000'
  },
  CZRX: {
    denomination: '100000000'
  },
  CWBTC: {
    denomination: '100000000'
  },
  CDAI: {
    denomination: '100000000'
  },
  CSAI: {
    denomination: '100000000'
  },
  CETH: {
    denomination: '100000000'
  },
  ETHBNT: {
    denomination: '1000000000000000000'
  },
  MET: {
    denomination: '1000000000000000000'
  },
  OXT: {
    denomination: '1000000000000000000'
  },
  SNX: {
    denomination: '1000000000000000000'
  },
  SBTC: {
    denomination: '1000000000000000000'
  },
  SUSD: {
    denomination: '1000000000000000000'
  },
  COMP: {
    denomination: '1000000000000000000'
  },
  AAVE: {
    denomination: '1000000000000000000'
  },
  AYFI: {
    denomination: '1000000000000000000'
  },
  ALINK: {
    denomination: '1000000000000000000'
  },
  ADAI: {
    denomination: '1000000000000000000'
  },
  ABAT: {
    denomination: '1000000000000000000'
  },
  AWETH: {
    denomination: '1000000000000000000'
  },
  AWBTC: {
    denomination: '100000000'
  },
  ASNX: {
    denomination: '1000000000000000000'
  },
  AREN: {
    denomination: '1000000000000000000'
  },
  AUSDT: {
    denomination: '1000000'
  },
  AMKR: {
    denomination: '1000000000000000000'
  },
  AMANA: {
    denomination: '1000000000000000000'
  },
  AZRX: {
    denomination: '1000000000000000000'
  },
  AKNC: {
    denomination: '1000000000000000000'
  },
  AUSDC: {
    denomination: '1000000'
  },
  ASUSD: {
    denomination: '1000000000000000000'
  },
  AUNI: {
    denomination: '1000000000000000000'
  },
  WBTC: {
    denomination: '100000000'
  },
  YFI: {
    denomination: '1000000000000000000'
  },
  CRV: {
    denomination: '1000000000000000000'
  },
  BAL: {
    denomination: '1000000000000000000'
  },
  SUSHI: {
    denomination: '1000000000000000000'
  },
  UMA: {
    denomination: '1000000000000000000'
  },
  BADGER: {
    denomination: '1000000000000000000'
  },
  IDLE: {
    denomination: '1000000000000000000'
  },
  NXM: {
    denomination: '1000000000000000000'
  },
  CREAM: {
    denomination: '1000000000000000000'
  },
  PICKLE: {
    denomination: '1000000000000000000'
  },
  CVP: {
    denomination: '1000000000000000000'
  },
  ROOK: {
    denomination: '1000000000000000000'
  },
  DOUGH: {
    denomination: '1000000000000000000'
  },
  COMBO: {
    denomination: '1000000000000000000'
  },
  INDEX: {
    denomination: '1000000000000000000'
  },
  WETH: {
    denomination: '1000000000000000000'
  },
  RENBTC: {
    denomination: '100000000'
  },
  RENBCH: {
    denomination: '100000000'
  },
  RENZEC: {
    denomination: '100000000'
  },
  TBTC: {
    denomination: '1000000000000000000'
  },
  DPI: {
    denomination: '1000000000000000000'
  },
  YETI: {
    denomination: '1000000000000000000'
  },
  BAND: {
    denomination: '1000000000000000000'
  },
  REN: {
    denomination: '1000000000000000000'
  },
  AMPL: {
    denomination: '1000000000'
  },
  OCEAN: {
    denomination: '1000000000000000000'
  },
  UNI: {
    denomination: '1000000000000000000'
  },
  FTM: {
    denomination: '1000000000000000000'
  },
  FUSDT: {
    denomination: '1000000'
  },
  MATIC: {
    denomination: '1000000000000000000'
  },
  customTokens: [],
  mostRecentWallets: [],
  passwordRecoveryRemindersShown: PASSWORD_RECOVERY_REMINDERS_SHOWN,
  walletsSort: 'default'
}

export const SYNCED_ACCOUNT_TYPES = {
  autoLogoutTimeInSeconds: 'number',
  defaultFiat: 'string',
  defaultIsoFiat: 'string',
  merchantMode: 'boolean',
  preferredSwapPluginId: 'string',
  countryCode: 'string',
  BTC: 'object',
  ZADDR: 'object',
  BCH: 'object',
  EOS: 'object',
  TLOS: 'object',
  WAX: 'object',
  XRP: 'object',
  XLM: 'object',
  DASH: 'object',
  DOGE: 'object',
  DGB: 'object',
  LTC: 'object',
  BNB: 'object',
  FTC: 'object',
  VTC: 'object',
  XTZ: 'object',
  RVN: 'object',
  FIRO: 'object',
  QTUM: 'object',
  XMR: 'object',
  ETH: 'object',
  ETC: 'object',
  UFO: 'object',
  REP: 'object',
  REPV2: 'object',
  WINGS: 'object',
  IND: 'object',
  HUR: 'object',
  HERC: 'object',
  SMART: 'object',
  ANTV1: 'object',
  ANT: 'object',
  BAT: 'object',
  BNT: 'object',
  GNT: 'object',
  GLM: 'object',
  KNC: 'object',
  POLY: 'object',
  STORJ: 'object',
  USDC: 'object',
  BRZ: 'object',
  LINK: 'object',
  USDS: 'object',
  TUSD: 'object',
  ZRX: 'object',
  GNO: 'object',
  OMG: 'object',
  NMR: 'object',
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
  SAI: 'object',
  RBTC: 'object',
  RIF: 'object',
  CREP: 'object',
  CUSDC: 'object',
  CBAT: 'object',
  CZRX: 'object',
  CWBTC: 'object',
  CSAI: 'object',
  CDAI: 'object',
  CETH: 'object',
  ETHBNT: 'object',
  MET: 'object',
  COMP: 'object',
  OXT: 'object',
  SNX: 'object',
  SUSD: 'object',
  SBTC: 'object',
  AAVE: 'object',
  AYFI: 'object',
  ALINK: 'object',
  ADAI: 'object',
  ABAT: 'object',
  AWETH: 'object',
  AWBTC: 'object',
  ASNX: 'object',
  AREN: 'object',
  AUSDT: 'object',
  AMKR: 'object',
  AMANA: 'object',
  AZRX: 'object',
  AKNC: 'object',
  AUSDC: 'object',
  ASUSD: 'object',
  AUNI: 'object',
  WBTC: 'object',
  TESTBTC: 'object',
  YFI: 'object',
  CRV: 'object',
  BAL: 'object',
  SUSHI: 'object',
  UMA: 'object',
  BADGER: 'object',
  IDLE: 'object',
  NXM: 'object',
  CREAM: 'object',
  PICKLE: 'object',
  CVP: 'object',
  ROOK: 'object',
  DOUGH: 'object',
  COMBO: 'object',
  INDEX: 'object',
  WETH: 'object',
  RENBTC: 'object',
  RENBCH: 'object',
  RENZEC: 'object',
  TBTC: 'object',
  DPI: 'object',
  YETI: 'object',
  BAND: 'object',
  REN: 'object',
  AMPL: 'object',
  OCEAN: 'object',
  UNI: 'object',
  FTM: 'object',
  FUSDT: 'object',
  HBAR: 'object',
  MATIC: 'object',
  customTokens: 'object', // arrays return 'object' to typeof
  mostRecentWallets: 'object',
  passwordRecoveryRemindersShown: 'object',
  walletsSort: 'string'
}

export const LOCAL_ACCOUNT_DEFAULTS = {
  bluetoothMode: false,
  developerModeOn: false,
  passwordReminder: {
    needsPasswordCheck: false,
    lastPasswordUseDate: 0,
    passwordUseCount: 0,
    nonPasswordLoginsCount: 0,
    nonPasswordDaysLimit: 4,
    nonPasswordLoginsLimit: 4
  },
  isAccountBalanceVisible: true,
  spendingLimits: {
    transaction: {
      amount: 0,
      isEnabled: false
    }
  }
}

export const LOCAL_ACCOUNT_TYPES = {
  bluetoothMode: 'boolean',
  developerModeOn: 'boolean',
  passwordReminder: 'object',
  isAccountBalanceVisible: 'boolean',
  spendingLimits: 'object'
}

const SYNCED_SETTINGS_FILENAME = 'Settings.json'
const LOCAL_SETTINGS_FILENAME = 'Settings.json'
const CATEGORIES_FILENAME = 'Categories.json'

//  Settings
// Core Settings

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

export const setPreferredSwapPluginId = (account: EdgeAccount, pluginId: string | void) => {
  return getSyncedSettings(account).then(settings => {
    const updatedSettings = updateSettings(settings, { preferredSwapPluginId: pluginId == null ? '' : pluginId })
    return setSyncedSettings(account, updatedSettings)
  })
}

export const setMostRecentWalletsSelected = (account: EdgeAccount, mostRecentWallets: MostRecentWallet[]) =>
  getSyncedSettings(account).then(settings => {
    const updatedSettings = updateSettings(settings, { mostRecentWallets })
    return setSyncedSettings(account, updatedSettings)
  })

export const setWalletsSort = (account: EdgeAccount, walletsSort: SortOption) =>
  getSyncedSettings(account).then(settings => {
    const updatedSettings = updateSettings(settings, { walletsSort })
    return setSyncedSettings(account, updatedSettings)
  })

// Local Settings
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

export const setDeveloperModeOn = (account: EdgeAccount, developerModeOn: boolean) => {
  return getLocalSettings(account).then(settings => {
    const updatedSettings = updateSettings(settings, { developerModeOn })
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
export async function setPasswordRecoveryRemindersAsync(account: EdgeAccount, level: number) {
  const settings = await getSyncedSettings(account)
  const passwordRecoveryRemindersShown = { ...settings.passwordRecoveryRemindersShown }
  passwordRecoveryRemindersShown[level] = true
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
export async function getSyncedSettings(account: EdgeAccount): Promise<any> {
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

export async function setSyncedSettings(account: EdgeAccount, settings: Object): Promise<void> {
  const text = JSON.stringify(settings)
  await account.disklet.setText(SYNCED_SETTINGS_FILENAME, text)
}

export type CategoriesFile = { categories: string[] }

export async function setSubcategoriesRequest(account: EdgeAccount, subcategories: CategoriesFile) {
  // const subcats = await getSyncedSubcategories(account)
  return setSyncedSubcategories(account, subcategories)
}

export async function setSyncedSubcategories(account: EdgeAccount, subcategories: CategoriesFile) {
  let finalText = {}
  if (!subcategories.categories) {
    finalText.categories = subcategories
  } else {
    finalText = subcategories
  }
  const stringifiedSubcategories = JSON.stringify(finalText)
  try {
    await account.disklet.setText(CATEGORIES_FILENAME, stringifiedSubcategories)
  } catch (error) {
    showError(error)
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
