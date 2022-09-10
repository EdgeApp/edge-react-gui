/* eslint-disable quote-props */

import { asArray, asBoolean, asMaybe, asNumber, asObject, asOptional, asString } from 'cleaners'
import { EdgeAccount, EdgeDenomination } from 'edge-core-js'

import { asSortOption, SortOption } from '../../../components/modals/WalletListSortModal'
import { showError } from '../../../components/services/AirshipInstance'
import { asMostRecentWallet, MostRecentWallet, PasswordReminder } from '../../../types/types'
import { currencyPlugins } from '../../../util/corePlugins'
import { categories } from './subcategories'

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

export type DenominationSettings = ReturnType<typeof asDenominationSettings>

export const asSyncedAccountSettings = asObject({
  autoLogoutTimeInSeconds: asOptional(asNumber, 3600),
  defaultFiat: asOptional(asString, 'USD'),
  defaultIsoFiat: asOptional(asString, 'iso:USD'),
  preferredSwapPluginId: asOptional(asString, ''),
  countryCode: asOptional(asString, ''),
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
  walletsSort: asOptional(asSortOption, 'manual'),
  denominationSettings: asOptional(asDenominationSettings, {})
})

// Default Account Settings
export const SYNCED_ACCOUNT_DEFAULTS = asSyncedAccountSettings({})

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

// Account Settings
export const setAutoLogoutTimeInSecondsRequest = async (account: EdgeAccount, autoLogoutTimeInSeconds: number) =>
  await getSyncedSettings(account).then(async settings => {
    const updatedSettings = updateSettings(settings, { autoLogoutTimeInSeconds })
    return await setSyncedSettings(account, updatedSettings)
  })

export const setDefaultFiatRequest = async (account: EdgeAccount, defaultFiat: string) =>
  await getSyncedSettings(account).then(async settings => {
    const updatedSettings = updateSettings(settings, { defaultFiat, defaultIsoFiat: `iso:${defaultFiat}` })
    return await setSyncedSettings(account, updatedSettings)
  })

export const setPreferredSwapPluginId = async (account: EdgeAccount, pluginId: string | undefined) => {
  return await getSyncedSettings(account).then(async settings => {
    const updatedSettings = updateSettings(settings, { preferredSwapPluginId: pluginId == null ? '' : pluginId })
    return await setSyncedSettings(account, updatedSettings)
  })
}

export const setMostRecentWalletsSelected = async (account: EdgeAccount, mostRecentWallets: MostRecentWallet[]) =>
  await getSyncedSettings(account).then(async settings => {
    const updatedSettings = updateSettings(settings, { mostRecentWallets })
    return await setSyncedSettings(account, updatedSettings)
  })

export const setWalletsSort = async (account: EdgeAccount, walletsSort: SortOption) =>
  await getSyncedSettings(account).then(async settings => {
    const updatedSettings = updateSettings(settings, { walletsSort })
    return await setSyncedSettings(account, updatedSettings)
  })

// Local Settings
export const setPasswordReminderRequest = async (account: EdgeAccount, passwordReminder: PasswordReminder) =>
  await getLocalSettings(account).then(async settings => {
    const updatedSettings = updateSettings(settings, { passwordReminder })
    return await setLocalSettings(account, updatedSettings)
  })

export const setAccountBalanceVisibility = async (account: EdgeAccount, isAccountBalanceVisible: boolean) => {
  return await getLocalSettings(account).then(async settings => {
    const updatedSettings = updateSettings(settings, { isAccountBalanceVisible })
    return await setLocalSettings(account, updatedSettings)
  })
}

export const setDeveloperModeOn = async (account: EdgeAccount, developerModeOn: boolean) => {
  return await getLocalSettings(account).then(async settings => {
    const updatedSettings = updateSettings(settings, { developerModeOn })
    return await setLocalSettings(account, updatedSettings)
  })
}

export type SpendingLimits = {
  transaction: {
    amount: number
    isEnabled: boolean
  }
}

export const setSpendingLimits = async (account: EdgeAccount, spendingLimits: SpendingLimits) => {
  return await getLocalSettings(account).then(async settings => {
    const updatedSettings = updateSettings(settings, { spendingLimits })
    const out = setLocalSettings(account, updatedSettings)
    global.logActivity(`Set Spending Limits: ${account.username} -- ${JSON.stringify(spendingLimits.transaction)}`)
    return await out
  })
}
export async function setPasswordRecoveryRemindersAsync(account: EdgeAccount, level: number) {
  const settings = await getSyncedSettings(account)
  const passwordRecoveryRemindersShown = { ...settings.passwordRecoveryRemindersShown }
  passwordRecoveryRemindersShown[level] = true
  const updatedSettings = updateSettings(settings, { passwordRecoveryRemindersShown })
  return await setSyncedSettings(account, updatedSettings)
}

// Currency Settings
export const setDenominationKeyRequest = async (account: EdgeAccount, pluginId: string, currencyCode: string, denomination: EdgeDenomination) =>
  await getSyncedSettings(account).then(async settings => {
    const updatedSettings = updateCurrencySettings(settings, pluginId, currencyCode, denomination)
    return await setSyncedSettings(account, updatedSettings)
  })

// Helper Functions
export async function getSyncedSettings(account: EdgeAccount): Promise<any> {
  try {
    const text = await account.disklet.getText(SYNCED_SETTINGS_FILENAME)
    const settingsFromFile = JSON.parse(text)
    return asSyncedAccountSettings(settingsFromFile)
  } catch (e: any) {
    console.log(e)
    // If Settings.json doesn't exist yet, create it, and return it
    await setSyncedSettings(account, SYNCED_ACCOUNT_DEFAULTS)
    return SYNCED_ACCOUNT_DEFAULTS
  }
}

export async function setSyncedSettings(account: EdgeAccount, settings: Object): Promise<void> {
  const text = JSON.stringify(settings)
  await account.disklet.setText(SYNCED_SETTINGS_FILENAME, text)
}

export type CategoriesFile = { categories: string[] }

export async function setSubcategoriesRequest(account: EdgeAccount, subcategories: CategoriesFile) {
  // const subcats = await getSyncedSubcategories(account)
  return await setSyncedSubcategories(account, subcategories)
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

export const getSyncedSubcategories = async (account: EdgeAccount) =>
  await account.disklet
    .getText(CATEGORIES_FILENAME)
    .then(text => {
      const categoriesText = JSON.parse(text)
      return categoriesText.categories
    })
    .catch(
      async () =>
        // If Categories.json doesn't exist yet, create it, and return it
        await setSyncedSubcategories(account, SYNCED_SUBCATEGORIES_DEFAULTS).then(() => SYNCED_SUBCATEGORIES_DEFAULTS.categories)
    )

export const getLocalSettings = async (account: EdgeAccount) => {
  return await account.localDisklet
    .getText(LOCAL_SETTINGS_FILENAME)
    .then(JSON.parse)
    .catch(async () => {
      // If Settings.json doesn't exist yet, create it, and return it
      return await setLocalSettings(account, LOCAL_ACCOUNT_DEFAULTS).then(() => LOCAL_ACCOUNT_DEFAULTS)
    })
    .then(settings => {
      return {
        ...LOCAL_ACCOUNT_DEFAULTS,
        ...settings
      }
    })
}

export const setLocalSettings = async (account: EdgeAccount, settings: Object) => {
  const text = JSON.stringify(settings)
  return await account.localDisklet.setText(LOCAL_SETTINGS_FILENAME, text)
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
