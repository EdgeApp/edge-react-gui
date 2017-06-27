export const createWalletRequest = (account, keys, walletType) => {
  const formattedWalletType = 'wallet:' + walletType.toLowerCase()
  return account.createWallet(formattedWalletType, keys)
}

export const activateWalletRequest = (account, walletId) => {
  return account.changeKeyStates({
    [walletId]: { archived: false }
  })
}

export const archiveWalletRequest = (account, walletId) => {
  return account.changeKeyStates({
    [walletId]: { archived: true }
  })
}

export const deleteWalletRequest = (account, walletId) => {
  return account.changeKeyStates({
    [walletId]: { deleted: true }
  })
}

export const updateActiveWalletsOrderRequest = (account, activeWalletIds) => {
  const newKeyStates = activeWalletIds.reduce((keyStates, id, index) => {
    keyStates[id] = { sortIndex: index }
    return keyStates
  }, {})

  return account.changeKeyStates(newKeyStates)
}

export const updateArchivedWalletsOrderRequest = (account, archivedWalletIds) => {
  const newKeyStates = archivedWalletIds.reduce((keyStates, id, index) => {
    keyStates[id] = { sortIndex: index }
    return keyStates
  }, {})

  return account.changeKeyStates(newKeyStates)
}

// /////// SETTINGS ///////////
export const setAutoLogoutTimeRequest = (account, autoLogoffTimeInSeconds) => {
  return updateSettingsFile(account, { autoLogoffTimeInSeconds })
}

export const setDefaultFiatCurrencyRequest = (account, defaultFiatCurrency) => {
  return updateSettingsFile(account, { defaultFiatCurrency })
}

export const setMerchantModeRequest = (account, merchantMode) => {
  return updateSettingsFile(account, { merchantMode })
}

export const getSettingsFile = account => {
  return account.folder.file('Settings.json')
}

export const updateSettingsFile = (account, newSettings) => {
  // get settings file from the account
  const settingsFile = getSettingsFile(account)
  return settingsFile.getText()
  .then(text => {
    const currentSettings = JSON.parse(text)
    // update with new settings
    const updatedSettings = {
      ...currentSettings,
      ...newSettings
    }
    // convert to string
    const updatedSettingsText = JSON.stringify(updatedSettings)

    // Save to settings file
    settingsFile.setText(updatedSettingsText)

    return updatedSettingsText
  })
}

//  Helper functions

// Account: [username]
// --------------------
// Security
// --------
// Auto logoff (3 way selector) (seconds) (default: 3600)
//
// Currencies
// ------------------
// Bitcoin >
  // Denomination (txlib -> getInfo -> denominations)
// Ethereum >
  // Denomination (txlib -> getInfo -> denominations)
