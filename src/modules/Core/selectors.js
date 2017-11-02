// Core/selectors.js
import type {AbcWallet} from 'airbitz-core-types'
export const getCore = (state) => state.core

// Context
export const getContext = (state) => {
  const core = getCore(state)
  const context = core.context.context
  return context
}

export const getUsernames = (state) => {
  const core = getCore(state)
  const usernames = core.context.usernames
  return usernames
}

export const getNextUsername = (state) => {
  const core = getCore(state)
  const nextUsername = core.context.nextUsername
  return nextUsername
}

export const getIO = (state) => {
  const context = getContext(state)
  const io = context.io
  return io
}

// Account
export const getAccount = (state) => {
  const core = getCore(state)
  const account = core.account
  return account
}

export const getUsername = (state) => {
  const account = getAccount(state)
  const username = account.username
  return username
}

export const getCurrencyConverter = (state) => {
  const account = getAccount(state)
  const currencyConverter = account.exchangeCache
  return currencyConverter
}

export const getExchangeRate = (state, fromCurrencyCode, toCurrencyCode) => {
  const currencyConverter = getCurrencyConverter(state)
  const exchangeRate = currencyConverter.convertCurrency(fromCurrencyCode, toCurrencyCode, 1)
  return exchangeRate
}

export const getFakeExchangeRate = (state, fromCurrencyCode, toCurrencyCode) => {
  const currencyConverter = getCurrencyConverter(state)
  const exchangeRate = currencyConverter.convertCurrency(fromCurrencyCode, toCurrencyCode, 1)
  return exchangeRate + (Math.random() * 10)
}

// Wallets
export const getWallets = (state): AbcCurrencyWallet => {
  const core = getCore(state)
  const wallets =core.wallets.byId
  return wallets
}

export const getWallet = (state, walletId): AbcWallet => {
  const wallets = getWallets(state)
  const wallet = wallets[walletId]
  return wallet
}

export const getWalletName = (state, walletId): AbcWallet => {
  const wallet = getWallet(state, walletId)
  return wallet && wallet.name
}

export const getBalanceInCrypto = (state, walletId, currencyCode) => {
  const wallet = getWallet(state, walletId)
  const balance = wallet.getBalance(currencyCode)
  return balance
}
