// @flow
import {
  AbcAccount
} from 'airbitz-core-types'

import {
  categories
} from './subcategories.js'

// Default Core Settings
export const CORE_DEFAULTS = {
  otpMode: false,
  pinMode: false
}

// TODO:  Remove hardcoded currency defaults
// Default Account Settings
export const SYNCED_ACCOUNT_DEFAULTS = {
  autoLogoutTimeInSeconds: 3600,
  defaultFiat: 'USD',
  merchantMode: false,
  'BTC': {denomination: '100000000'},
  'BCH': {denomination: '100000000'},
  'DASH': {denomination: '100000000'},
  'LTC': {denomination: '100000000'},
  'ETH': {denomination: '1000000000000000000'},
  'REP': {denomination: '1000000000000000000'},
  'WINGS': {denomination: '1000000000000000000'},
  customTokens: []
}

export const LOCAL_ACCOUNT_DEFAULTS = {bluetoothMode: false}

const SYNCHED_SETTINGS_FILENAME = 'Settings.json'
const LOCAL_SETTINGS_FILENAME = 'Settings.json'
const CATEGORIES_FILENAME = 'Categories.json'

//  Settings
// Core Settings
export const setOtpModeRequest = (account: AbcAccount, otpMode: Boolean) =>
  otpMode // $FlowFixMe enableOtp not found on AbcAccount type
  ? account.enableOtp() // $FlowFixMe disableOtp not found on AbcAccount type
  : account.disableOtp()

export const setOTPRequest = (account: AbcAccount, key: string) =>
// $FlowFixMe setupOTPKey not found on AbcAccount type
account.setupOTPKey(key)

export const setPinModeRequest = (account: AbcAccount, pinMode: Boolean) =>
  pinMode // $FlowFixMe enablePIN not found on AbcAccount type
  ? account.enablePIN() // $FlowFixMe isablePIN not found on AbcAccount type
  : account.disablePIN()

export const setPinRequest = (account: AbcAccount, pin: string) =>
  account.changePIN(pin)

// Account Settings
export const setAutoLogoutTimeInSecondsRequest = (account: AbcAccount, autoLogoutTimeInSeconds: number) =>
  getSyncedSettings(account)
  .then((settings) => {
    const updatedSettings = updateSettings(settings, {autoLogoutTimeInSeconds})
    return setSyncedSettings(account, updatedSettings)
  })

export const setDefaultFiatRequest = (account: AbcAccount, defaultFiat: string) =>
  getSyncedSettings(account)
  .then((settings) => {
    const updatedSettings = updateSettings(settings, {defaultFiat})
    return setSyncedSettings(account, updatedSettings)
  })

export const setMerchantModeRequest = (account: AbcAccount, merchantMode: Boolean) =>
  getSyncedSettings(account)
  .then((settings) => {
    const updatedSettings = updateSettings(settings, {merchantMode})
    return setSyncedSettings(account, updatedSettings)
  })

// Local Settings
export const setBluetoothModeRequest = (account: AbcAccount, bluetoothMode: Boolean) =>
  getLocalSettings(account)
  .then((settings) => {
    const updatedSettings = updateSettings(settings, {bluetoothMode})
    return setLocalSettings(account, updatedSettings)
  })

// Currency Settings
export const setDenominationKeyRequest = (account: AbcAccount, currencyCode: string, denomination: string) =>
  getSyncedSettings(account)
  .then((settings) => {
    const updatedSettings = updateCurrencySettings(settings, currencyCode, {denomination})
    return setSyncedSettings(account, updatedSettings)
  })

// Helper Functions
export const getSyncedSettings = (account: AbcAccount) =>
  getSyncedSettingsFile(account).getText()
  .then(JSON.parse)
  .catch((e) => {
    console.log(e)
    // If Settings.json doesn't exist yet, create it, and return it
    return setSyncedSettings(account, SYNCED_ACCOUNT_DEFAULTS)
  })

export const setSyncedSettings = (account: AbcAccount, settings: Object) => {
  const text = JSON.stringify(settings)
  const SettingsFile = getSyncedSettingsFile(account)

  return SettingsFile.setText(text)
}

export async function setSubcategoriesRequest (account: AbcAccount, subcategories: any) {
    // const subcats = await getSyncedSubcategories(account)
  return setSyncedSubcategories(account, subcategories)
}

export async function setSyncedSubcategories (account: AbcAccount, subcategories: any) {
  let finalText = {}
  if (!subcategories.categories) {
    finalText.categories = subcategories
  } else {
    finalText = subcategories
  }
  const SubcategoriesFile = getSyncedSubcategoriesFile(account)
  let stringifiedSubcategories = JSON.stringify(finalText)
  try {
    await SubcategoriesFile.setText(stringifiedSubcategories)
  } catch (e) {
    console.log('error: ', e)
  }
}

export const getSyncedSubcategories = (account: AbcAccount) =>
  getSyncedSubcategoriesFile(account).getText()
  .then((text) => {
    let categoriesText = JSON.parse(text)
    return categoriesText.categories
  })
  .catch(() =>
    // console.log('error: ', e)
    // If Categories.json doesn't exist yet, create it, and return it
     setSyncedSubcategories(account, SYNCED_SUBCATEGORIES_DEFAULTS)
    .then(() => SYNCED_SUBCATEGORIES_DEFAULTS))

export const getSyncedSubcategoriesFile = (account: AbcAccount) =>
   // $FlowFixMe folder not found on AbcAccount type
   account.folder.file(CATEGORIES_FILENAME)

export const getLocalSettings = (account: AbcAccount) =>
  getLocalSettingsFile(account).getText()
  .then(JSON.parse)
  .catch(() =>
    // console.log('error: ', e)
    // If Settings.json doesn't exist yet, create it, and return it
     setLocalSettings(account, LOCAL_ACCOUNT_DEFAULTS)
    .then(() => LOCAL_ACCOUNT_DEFAULTS))

export const setLocalSettings = (account: AbcAccount, settings: Object) => {
  const text = JSON.stringify(settings)
  const localSettingsFile = getLocalSettingsFile(account)
  return localSettingsFile.setText(text)
}


export const getCoreSettings = (account: AbcAccount): Promise<{otpMode: boolean, pinMode: boolean}> => { // eslint-disable-line no-unused-vars
  const coreSettings: {otpMode: boolean, pinMode: boolean} = CORE_DEFAULTS
  // TODO: Get each setting separately,
  // build up settings object,
  // return settings object
  return Promise.resolve(coreSettings)
}

export const getSyncedSettingsFile = (account: AbcAccount) => {
  // $FlowFixMe folder not found on AbcAccount type
  const folder = account.folder
//   console.log(folder)
  return folder.file(SYNCHED_SETTINGS_FILENAME)
}

export const getLocalSettingsFile = (account: AbcAccount) =>
  // $FlowFixMe localFolder not found on AbcAccount type
  account.localFolder.file(LOCAL_SETTINGS_FILENAME)

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
