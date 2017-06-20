// import { activateWalletSuccess, archiveWalletSuccess } from ''

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
  // const newKeyStates = activeWalletIds.reduce((keyStates, id, index) => {
  //   keyStates[id] = { sortIndex: index }
  //   return keyStates
  // }, {})
  //
  // return account.changeKeyStates(newKeyStates)
}

export const updateArchivedWalletsOrderRequest = (account, archivedWalletIds) => {
  // const newKeyStates = archivedWalletIds.reduce((newKeyStates, id, index) => {
  //   newKeyStates[id] = index
  //   return newKeyStates
  // }, {})
  //
  // return account.changeKeyStates(newKeyStates)

  return account.changeKeyStates({
    [archivedWalletIds[0]]: { sortIndex: parseInt(Math.random() * 10) },
    [archivedWalletIds[1]]: { sortIndex: parseInt(Math.random() * 10) }
  })
}

export const enablePinLoginRequest = () => {
  return (dispatch, getState) => {
    const state = getState()
    const { account } = state.core

    account.pinLogin = true

    account.folder.file('settings.json').getText()
    .then(currentSettings => {
      const settings = JSON.parse(currentSettings)
      settings.pinLogin = true
      const newSettings = JSON.stringify(settings)

      return account.folder.file('settings').setText(newSettings)
    })
  }
}

export const disablePinLoginRequest = () => {
  return (dispatch, getState) => {
    const state = getState()
    const { account } = state.core

    account.pinLogin = false

    account.folder.file('settings.json').getText()
    .then(text => {
      const settings = JSON.parse(text)
      settings.pinLogin = false

      return account.folder.file('settings').setText(settings)
    })
  }
}

export const enableTouchIdRequest = () => {
  return (dispatch, getState) => {
    const state = getState()
    const { account } = state.core

    account.touchId = true

    account.folder.file('settings').getText()
    .then(currentSettings => {
      const settings = JSON.parse(currentSettings)
      settings.touchId = true
      const newSettings = JSON.stringify(settings)

      return account.folder.file('settings').setText(newSettings)
    })
  }
}

export const disableTouchIdLoginRequest = () => {
  return (dispatch, getState) => {
    const state = getState()
    const { account } = state.core

    account.touchId = false

    account.folder.file('settings').getText()
    .then(text => {
      const settings = JSON.parse(text)
      settings.touchId = false

      return account.folder.file('settings').setText(settings)
    })
  }
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
