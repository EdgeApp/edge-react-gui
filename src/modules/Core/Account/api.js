// @flow

// Core/Account/api.js
import type { EdgeAccount, EdgeCreateCurrencyWalletOptions } from 'edge-core-js'

export const logoutRequest = (account: EdgeAccount) => {
  return account.logout()
}

export const getFirstActiveWalletInfo = (account: EdgeAccount, currencyCodes: { [string]: string }) => {
  const walletId = account.activeWalletIds[0]
  const walletKey = account.allKeys.find(key => key.id === walletId)
  if (!walletKey) {
    throw new Error('Cannot find a walletInfo for the active wallet')
  }
  const currencyCode = currencyCodes[walletKey.type]
  return {
    walletId,
    currencyCode
  }
}

export const createCurrencyWalletRequest = (account: EdgeAccount, walletType: string, opts: EdgeCreateCurrencyWalletOptions) => {
  return account.createCurrencyWallet(walletType, opts)
}

export const activateWalletRequest = (account: EdgeAccount, walletId: string) => {
  return account.changeWalletStates({ [walletId]: { archived: false } })
}

export const restoreWalletsRequest = (account: EdgeAccount) => {
  const restoreKeys = account.allKeys.filter(key => key.archived || key.deleted)
  return Promise.all(
    restoreKeys.map(key => key.id).map(walletId =>
      account.changeWalletStates({
        [walletId]: { archived: false, deleted: false }
      })
    )
  )
}

export const archiveWalletRequest = (account: EdgeAccount, walletId: string) => {
  return account.changeWalletStates({ [walletId]: { archived: true } })
}

export const deleteWalletRequest = (account: EdgeAccount, walletId: string) => {
  return account.changeWalletStates({ [walletId]: { deleted: true } })
}

export const updateActiveWalletsOrderRequest = (account: EdgeAccount, activeWalletIds: Array<string>) => {
  const newKeyStates = activeWalletIds.reduce((keyStates, id, index) => {
    keyStates[id] = { sortIndex: index }
    return keyStates
  }, {})
  return account.changeWalletStates(newKeyStates).then(() => account.activeWalletIds)
}

export const updateArchivedWalletsOrderRequest = (account: EdgeAccount, archivedWalletIds: Array<string>) => {
  const newKeyStates = archivedWalletIds.reduce((keyStates, id, index) => {
    keyStates[id] = { sortIndex: index }
    return keyStates
  }, {})

  return account.changeWalletStates(newKeyStates).then(() => account.archivedWalletIds)
}

export const checkPassword = (account: EdgeAccount, password: string) => {
  return account.checkPassword(password)
}

export const checkPin = (account: EdgeAccount, pin: string): Promise<boolean> => {
  return account.checkPin(pin)
}
