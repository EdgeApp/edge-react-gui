/* eslint-disable quote-props */
// @flow

import { asArray, asBoolean, asMaybe, asNumber, asObject, asOptional, asString } from 'cleaners'
import type { EdgeAccount, EdgeDenomination } from 'edge-core-js'

import type { SortOption } from '../../../components/modals/WalletListSortModal.js'
import { asSortOption } from '../../../components/modals/WalletListSortModal.js'
import { showError } from '../../../components/services/AirshipInstance.js'
import { type MostRecentWallet, type PasswordReminder, asCustomTokenInfo, asMostRecentWallet } from '../../../types/types.js'
import { currencyPlugins } from '../../../util/corePlugins.js'
import { categories } from './subcategories.js'

// prettier-ignore
export const PASSWORD_RECOVERY_REMINDERS_SHOWN = {
  '20': false,
  '200': false,
  '2000': false,
  '20000': false,
  '200000': false
}

export const asCurrencyCodeDenom = asObject({
  name: asString,
  multiplier: asString,
  symbol: asOptional(asString)
})

const asDenominationSettings = asObject(
  Object.keys(currencyPlugins).reduce((currencyPluginSettingsMap, pluginId) => {
    currencyPluginSettingsMap[pluginId] = asOptional(asObject(asMaybe(asCurrencyCodeDenom)), {})
    return currencyPluginSettingsMap
  }, {})
)

export type DenominationSettings = $Call<typeof asDenominationSettings>

export const asSyncedAccountSettings = asOptional(
  asObject({
    autoLogoutTimeInSeconds: asOptional(asNumber, 3600),
    defaultFiat: asOptional(asString, 'USD'),
    defaultIsoFiat: asOptional(asString, 'iso:USD'),
    preferredSwapPluginId: asOptional(asString, ''),
    countryCode: asOptional(asString, ''),
    customTokens: asOptional(asArray(asCustomTokenInfo), []),
    mostRecentWallets: asOptional(asArray(asMostRecentWallet), []),
    passwordRecoveryRemindersShown: asOptional(
      asObject({
        '20': asBoolean,
        '200': asBoolean,
        '2000': asBoolean,
        '20000': asBoolean,
        '200000': asBoolean
      }),
      PASSWORD_RECOVERY_REMINDERS_SHOWN
    ),
    walletsSort: asOptional(asSortOption, 'default'),
    denominationSettings: asOptional(asDenominationSettings, {})
  })
)

// Default Account Settings
export const SYNCED_ACCOUNT_DEFAULTS = {
  autoLogoutTimeInSeconds: 3600,
  defaultFiat: 'USD',
  defaultIsoFiat: 'iso:USD',
  preferredSwapPluginId: '',
  countryCode: '',
  denominationSettings: {},
  customTokens: [],
  mostRecentWallets: [],
  passwordRecoveryRemindersShown: PASSWORD_RECOVERY_REMINDERS_SHOWN,
  walletsSort: 'default'
}

export const SYNCED_ACCOUNT_TYPES = {
  autoLogoutTimeInSeconds: 'number',
  defaultFiat: 'string',
  defaultIsoFiat: 'string',
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
  AVAX: 'object',
  customTokens: 'object', // arrays return 'object' to typeof
  mostRecentWallets: 'object',
  passwordRecoveryRemindersShown: 'object',
  walletsSort: 'string'
}

export const LOCAL_ACCOUNT_DEFAULTS = {
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
export const setDenominationKeyRequest = (account: EdgeAccount, pluginId: string, currencyCode: string, denomination: EdgeDenomination) =>
  getSyncedSettings(account).then(settings => {
    const updatedSettings = updateCurrencySettings(settings, pluginId, currencyCode, denomination)
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

export const updateCurrencySettings = (currentSettings: Object, pluginId: string, currencyCode: string, denomination: EdgeDenomination) => {
  // update with new settings
  const updatedSettings = {
    ...currentSettings
  }
  if (updatedSettings.denominationSettings[pluginId] == null) updatedSettings.denominationSettings[pluginId] = {}
  updatedSettings.denominationSettings[pluginId][currencyCode] = denomination
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
