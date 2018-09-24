// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'

import type { State } from '../ReduxTypes'
import { convertCurrency } from '../UI/selectors.js'
import { getDefaultIsoFiat } from '../UI/Settings/selectors.js'

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

export const getFakeExchangeRate = (state: State, fromCurrencyCode: string, toCurrencyCode: string) => {
  const exchangeRate = convertCurrency(state, fromCurrencyCode, toCurrencyCode, 1)
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

export const buildExchangeRates = async (state: State) => {
  const wallets = getWallets(state)
  const accountIsoFiat = getDefaultIsoFiat(state)
  const walletIds = Object.keys(wallets)
  const exchangeRates = {}
  const finalExchangeRates = {}
  for (const id of walletIds) {
    const wallet = wallets[id]
    const walletIsoFiat = wallet.fiatCurrencyCode
    const currencyCode = wallet.currencyInfo.currencyCode // should get GUI or core versions?
    // need to get both forward and backwards exchange rates for wallets & account fiats, for each parent currency AND each token
    exchangeRates[`${currencyCode}_${walletIsoFiat}`] = fetchExchangeRateFromCore(state, currencyCode, walletIsoFiat)
    exchangeRates[`${currencyCode}_${accountIsoFiat}`] = fetchExchangeRateFromCore(state, currencyCode, accountIsoFiat)
    // add them to the list of promises to resolve
    // keep track of the exchange rates
    // now add tokens, if they exist
    for (const tokenCode in wallet.balances) {
      if (tokenCode !== currencyCode) {
        exchangeRates[`${tokenCode}_${walletIsoFiat}`] = fetchExchangeRateFromCore(state, tokenCode, walletIsoFiat)
        exchangeRates[`${tokenCode}_${accountIsoFiat}`] = fetchExchangeRateFromCore(state, tokenCode, accountIsoFiat)
      }
    }
  }
  const exchangeRateKeys = Object.keys(exchangeRates)
  const exchangeRatePromises = Object.values(exchangeRates)
  const rates = await Promise.all(exchangeRatePromises)
  for (let i = 0; i < exchangeRateKeys.length; i++) {
    const rate = rates[i]
    const key = exchangeRateKeys[i]
    const codes = key.split('_')
    const reverseExchangeRateKey = `${codes[1]}_${codes[0]}`
    if (isNaN(rate)) {
      finalExchangeRates[key] = 0
      finalExchangeRates[reverseExchangeRateKey] = 0
    } else {
      finalExchangeRates[key] = rate
      if (rate !== 0) {
        // if it's a real rate and can be multiplicatively inverted
        finalExchangeRates[reverseExchangeRateKey] = 1 / parseFloat(rate)
      } else {
        finalExchangeRates[reverseExchangeRateKey] = 0
      }
    }
  }
  return finalExchangeRates
}

export const fetchExchangeRateFromCore = (state: State, fromCurrencyCode: string, toCurrencyCode: string): Promise<number> => {
  const currencyConverter = getCurrencyConverter(state)
  const exchangeRate = currencyConverter.convertCurrency(fromCurrencyCode, toCurrencyCode, 1)
  return Promise.resolve(exchangeRate)
}
