// Default Account Settings
export const SYNCED_DEFAULTS = {
  autoLogoutTimeInSeconds: 3600,
  defaultFiat: 'USD',
  merchantMode: false,
  'BTC': {
    denomination: 1
  },
  'ETH': {
    denomination: 1
  }
}

export const LOCAL_DEFAULTS = {
  bluetoothMode: false
}

//  Settings
export const setAutoLogoutTimeRequest = (account, autoLogoutTimeInSeconds) => {
  return getSyncedSettings(account)
  .then(settings => {
    console.log('settings', settings)
    const updatedSettings = updateSettings(settings, { autoLogoutTimeInSeconds })
    console.log('updatedSettings', updatedSettings)
    return setSyncedSettings(account, updatedSettings)
  })
}

export const setDefaultFiatRequest = (account, defaultFiat) => {
  return getSyncedSettings(account)
  .then(settings => {
    const updatedSettings = updateSettings(settings, { defaultFiat })
    return setSyncedSettings(account, updatedSettings)
  })
}

export const setMerchantModeRequest = (account, merchantMode) => {
  return getSyncedSettings(account)
  .then(settings => {
    const updatedSettings = updateSettings(settings, { merchantMode })
    return setSyncedSettings(account, updatedSettings)
  })
}

// Local Settings
export const setBluetoothModeRequest = (account, bluetoothMode) => {
  return getLocalSettings(account)
  .then(settings => {
    const updatedSettings = updateSettings(settings, { bluetoothMode })
    return setLocalSettings(account, updatedSettings)
  })
}

// Bitcoin Settings
export const setBitcoinDenominationRequest = (account, denomination) => {
  return getSyncedSettings(account)
  .then(settings => {
    const updatedSettings = updateCurrencySettings(settings, 'BTC', { denomination })
    return setSyncedSettings(account, updatedSettings)
  })
}

// Ethereum Settings
export const setEthereumDenominationRequest = (account, denomination) => {
  return getSyncedSettings(account)
  .then(settings => {
    const updatedSettings = updateCurrencySettings(settings, 'ETH', { denomination })
    return setSyncedSettings(account, updatedSettings)
  })
}

// Helper Functions
export const getSyncedSettings = account => {
  return getSyncedSettingsFile(account).getText()
  .then(text => {
    return JSON.parse(text)
  })
  .catch(e => {
    console.log(e)
    // If Settings.json doesn't exist yet, create it, and return it
    return setSyncedSettings(account, SYNCED_DEFAULTS)
    .then(() => {
      return SYNCED_DEFAULTS
    })
  })
}

export const setSyncedSettings = (account, settings) => {
  const text = JSON.stringify(settings)
  const SettingsFile = getSyncedSettingsFile(account)

  return SettingsFile.setText(text)
}

export const getLocalSettings = account => {
  return getLocalSettingsFile(account).getText()
  .then(text => {
    return JSON.parse(text)
  })
  .catch(e => {
    console.log(e)
    // If Settings.json doesn't exist yet, create it, and return it
    return setLocalSettings(account, LOCAL_DEFAULTS)
    .then(() => {
      return LOCAL_DEFAULTS
    })
  })
}

export const setLocalSettings = (account, settings) => {
  const text = JSON.stringify(settings)
  const localSettingsFile = getLocalSettingsFile(account)

  return localSettingsFile.setText(text)
}

export const getSyncedSettingsFile = account => {
  return account.folder.file('Settings.json')
}

export const getLocalSettingsFile = account => {
  return account.localFolder.file('Settings.json')
}

export const updateCurrencySettings = (currentSettings, currencyCode, newSetting) => {
  const currencySettings = currentSettings[currencyCode]
  // update with new settings
  const updatedSettings = {
    ...currentSettings,
    [currencyCode]: {
      ...currencySettings,
      newSetting
    }
  }
  return updatedSettings
}

export const updateSettings = (currentSettings, newSettings) => {
  // update with new settings
  const updatedSettings = {
    ...currentSettings,
    ...newSettings
  }
  return updatedSettings
}
