// Core/Account/api.js
import * as UTILS from '../../utils'

export const logoutRequest = (account) => account.logout()

export const getFirstActiveWalletInfo = (account) => {
  const walletId = account.activeWalletIds[0]
  const walletKey = account.allKeys.find(key => key.id === walletId)
  const currencyCode = UTILS.getCurrencyCodeFromWalletType(walletKey.type)
  return {
    walletId,
    currencyCode
  }
}

export const createWalletRequest = (account, keys, walletType) => account.createWallet(walletType, keys)

export const activateWalletRequest = (account, walletId) => account.changeWalletStates({
  [walletId]: {archived: false}
})

export const archiveWalletRequest = (account, walletId) => account.changeWalletStates({
  [walletId]: {archived: true}
})

export const deleteWalletRequest = (account, walletId) => account.changeWalletStates({
  [walletId]: {deleted: true}
})

export const updateActiveWalletsOrderRequest = (account, activeWalletIds) => {

  const newKeyStates = activeWalletIds.reduce((keyStates, id, index) => {
    keyStates[id] = {sortIndex: index}
    return keyStates
  }, {})
  console.log('newKeyStates are: ', newKeyStates)
  return account.changeWalletStates(newKeyStates)
}

export const updateArchivedWalletsOrderRequest = (account, archivedWalletIds) => {
  const newKeyStates = archivedWalletIds.reduce((keyStates, id, index) => {
    keyStates[id] = {sortIndex: index}
    return keyStates
  }, {})

  return account.changeWalletStates(newKeyStates)
}
