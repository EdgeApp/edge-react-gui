// import { renameWalletStart } from ''

import { makeCurrencyWallet } from 'airbitz-core-js'
import { makeShitcoinPlugin } from 'airbitz-currency-shitcoin'
import { makeWalletCallbacks } from './callbacks.js'

export const makeCurrencyWalletRequest = (keyInfo, dispatch, getState) => {
  const state = getState()
  const { account, context: { io } } = state.core
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
    Promise.resolve(wallet)
  })
}

export const archiveWalletRequest = wallet => {
  return wallet.stopEngine()
  .then(() => {
    Promise.resolve(wallet)
  })
}

export const deleteWalletRequest = wallet => {
  return wallet.stopEngine()
  .then(() => {
    Promise.resolve(wallet)
  })
}
