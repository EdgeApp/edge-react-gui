// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'

import type { State } from '../ReduxTypes'

export const getCore = (state: State) => state.core

// Context
export const getContext = (state: State) => {
  const core = getCore(state)
  const context = core.context.context
  return context
}

export const getFolder = (state: State) => {
  const core = getCore(state)
  const folder = core.context.folder
  return folder
}

export const getUsernames = (state: State) => {
  const core = getCore(state)
  const usernames = core.context.usernames
  return usernames
}

export const getNextUsername = (state: State) => {
  const core = getCore(state)
  const nextUsername = core.context.nextUsername
  return nextUsername
}

// Account
export const getAccount = (state: State) => {
  const core = getCore(state)
  const account = core.account
  return account
}

export const getUsername = (state: State) => {
  const account = getAccount(state)
  const username = account.username
  return username
}

export const getCurrencyConverter = (state: State) => {
  const account = getAccount(state)
  const currencyConverter = account.exchangeCache
  return currencyConverter
}

export const getExchangeRate = (state: State, fromCurrencyCode: string, toCurrencyCode: string) => {
  const currencyConverter = getCurrencyConverter(state)
  const exchangeRate = currencyConverter.convertCurrency(fromCurrencyCode, toCurrencyCode, 1)
  return exchangeRate
}

export const getFakeExchangeRate = (state: State, fromCurrencyCode: string, toCurrencyCode: string) => {
  const currencyConverter = getCurrencyConverter(state)
  const exchangeRate = currencyConverter.convertCurrency(fromCurrencyCode, toCurrencyCode, 1)
  return exchangeRate + Math.random() * 10
}

// Wallets
export const getWallets = (state: State): { [walletId: string]: EdgeCurrencyWallet } => {
  const core = getCore(state)
  const wallets = core.wallets.byId
  return wallets
}

export const getWallet = (state: State, walletId: string): EdgeCurrencyWallet => {
  const wallets = getWallets(state)
  const wallet = wallets[walletId]
  return wallet
}

export const getWalletName = (state: State, walletId: string): string => {
  const wallet = getWallet(state, walletId)
  return (wallet && wallet.name) || 'no wallet name'
}

export const getBalanceInCrypto = (state: State, walletId: string, currencyCode: string) => {
  const wallet = getWallet(state, walletId)
  const balance = wallet.getBalance({ currencyCode })
  return balance
}
