// @flow
// Core/Account/api.js
import {AbcAccount, AbcCreateCurrencyWalletOptions} from 'airbitz-core-types'

export const logoutRequest = (account: AbcAccount) => account.logout()

export const getFirstActiveWalletInfo = (
  account: AbcAccount,
  currencyCodes: { [string]: string }
) => {
  const walletId = account.activeWalletIds[0]
  const walletKey = account.allKeys.find((key) => key.id === walletId)
  if (!walletKey) {
    throw new Error('Cannot find a walletInfo for the active wallet')
  }
  const currencyCode = currencyCodes[walletKey.type]
  return {
    walletId,
    currencyCode
  }
}

export const checkForExistingWallets = (account: AbcAccount) =>
  account.activeWalletIds.length > 0

export const createCurrencyWalletRequest = (
  account: AbcAccount,
  walletType: string,
  opts: AbcCreateCurrencyWalletOptions
) => account.createCurrencyWallet(walletType, opts)

export const activateWalletRequest = (account: AbcAccount, walletId: string) =>
  account.changeWalletStates({[walletId]: {archived: false} })

export const archiveWalletRequest = (account: AbcAccount, walletId: string) =>
  account.changeWalletStates({[walletId]: {archived: true} })

export const deleteWalletRequest = (account: AbcAccount, walletId: string) =>
  account.changeWalletStates({[walletId]: {deleted: true} })

export const updateActiveWalletsOrderRequest = (
  account: AbcAccount,
  activeWalletIds: Array<string>
) => {
  const newKeyStates = activeWalletIds.reduce((keyStates, id, index) => {
    keyStates[id] = {sortIndex: index}
    return keyStates
  }, {})
  return account.changeWalletStates(newKeyStates)
}

export const updateArchivedWalletsOrderRequest = (
  account: AbcAccount,
  archivedWalletIds: Array<string>
) => {
  const newKeyStates = archivedWalletIds.reduce((keyStates, id, index) => {
    keyStates[id] = {sortIndex: index}
    return keyStates
  }, {})

  return account.changeWalletStates(newKeyStates)
}
