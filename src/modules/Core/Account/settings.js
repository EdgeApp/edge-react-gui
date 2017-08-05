// Default Core Settings
export const CORE_DEFAULTS = {
  otpMode: false,
  pinMode: false
}

// Default Account Settings
export const SYNCED_ACCOUNT_DEFAULTS = {
  autoLogoutTimeInSeconds: 3600,
  defaultFiat: 'USD',
  merchantMode: false,
  'BTC': {
    denomination: 100000000
  },
  'ETH': {
    denomination: 100000000
  },
  'REP': {
    denomination: 100000000
  },
  'WINGS': {
    denomination: 100000000
  },
  'LUN': {
    denomination: 100000000
  }
}

export const LOCAL_ACCOUNT_DEFAULTS = {
  bluetoothMode: false
}

//  Settings
// Core Settings
export const setOtpModeRequest = (account, otpMode) => {
  if (otpMode === true) {
    return account.enableOTP()
  } else if (otpMode === false) {
    return account.disableOTP()
  } else {
    throw Error('Invalid OTP Mode')
  }
}

export const setOTPRequest = (account, key) => {
  return account.setupOTPKey(key)
}

export const setPinModeRequest = (account, pinMode) => {
  if (pinMode === true) {
    return account.enablePIN()
  } else if (pinMode === false) {
    return account.disablePIN()
  } else {
    throw Error('Invalid PIN Mode')
  }
}

export const setPinRequest = (account, pin) => {
  return account.changePIN(pin)
}

// Account Settings
export const setAutoLogoutTimeRequest = (account, autoLogoutTimeInSeconds) => {
  return getSyncedSettings(account)
  .then(settings => {
    const updatedSettings = updateSettings(settings, { autoLogoutTimeInSeconds })
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
    return setSyncedSettings(account, SYNCED_ACCOUNT_DEFAULTS)
    .then(() => {
      return SYNCED_ACCOUNT_DEFAULTS
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
    return setLocalSettings(account, LOCAL_ACCOUNT_DEFAULTS)
    .then(() => {
      return LOCAL_ACCOUNT_DEFAULTS
    })
  })
}

export const setLocalSettings = (account, settings) => {
  const text = JSON.stringify(settings)
  const localSettingsFile = getLocalSettingsFile(account)

  return localSettingsFile.setText(text)
}

export const getCoreSettings = account => {
  const coreSettings = CORE_DEFAULTS
  // TODO: Get each setting separately,
  // build up settings object,
  // return settings object
  return Promise.resolve(coreSettings)
}

export const getSyncedSettingsFile = account => {
  return account.folder.file('Settings.json')
}

export const getLocalSettingsFile = account => {
  return account.localFolder.file('Settings.json')
}

export const updateCurrencySettings = (currentSettings, currencyCode, newSettings) => {
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

export const updateSettings = (currentSettings, newSettings) => {
  // update with new settings
  const updatedSettings = {
    ...currentSettings,
    ...newSettings
  }
  return updatedSettings
}
