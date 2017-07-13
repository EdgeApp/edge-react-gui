// import { renameWalletStart } from ''

import { makeCurrencyWallet } from 'airbitz-core-js'
import { makeShitcoinPlugin } from 'airbitz-currency-shitcoin'
import { makeWalletCallbacks } from './callbacks.js'
import * as CORE_SELECTORS from '../../Core/selectors.js'

export const makeCurrencyWalletRequest = (keyInfo, dispatch, getState) => {
  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  const io = CORE_SELECTORS.getIO(state)
  const plugin = makeShitcoinPlugin({ io })
  const walletId = keyInfo.id
  const callbacks = makeWalletCallbacks(dispatch, walletId)
  const opts = {
    account,
    plugin,
    callbacks,
    io
  }

  return makeCurrencyWallet(keyInfo, opts)
}

export const renameWalletRequest = (wallet, name) => {
  return wallet.renameWallet(name)
  .then(() => {
    Promise.resolve(wallet)
  })
}

export const activateWalletRequest = wallet => {
  return wallet.startEngine()
  .then(() => {
    wallet.archived = false
    wallet.deleted = false
    return Promise.resolve(wallet)
  })
}

export const archiveWalletRequest = wallet => {
  return wallet.stopEngine()
  .then(() => {
    wallet.archived = true
    wallet.deleted = false
    return Promise.resolve(wallet)
  })
}

export const getTransactions = (wallet, currencyCode) => {
  return wallet.getTransactions({currencyCode})
}

export const setTransactionDetailsRequest = (wallet, transactionDetails) => {
  return wallet.saveTx(transactionDetails)
}
