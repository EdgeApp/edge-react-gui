// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'

import type { State } from '../../types/reduxTypes.js'
import { getYesterdayDateRoundDownHour } from '../../util/utils.js'
import { getDefaultIsoFiat } from '../Settings/selectors.js'

// Wallets
export const getWallets = (state: State): { [walletId: string]: EdgeCurrencyWallet } => {
  const wallets = state.core.wallets.byId
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

export const buildExchangeRates = async (state: State) => {
  const wallets = getWallets(state)
  const accountIsoFiat = getDefaultIsoFiat(state)
  const walletIds = Object.keys(wallets)
  const exchangeRates = {}
  const finalExchangeRates = {}
  const yesterdayDate = getYesterdayDateRoundDownHour()
  if (accountIsoFiat !== 'iso:USD') {
    exchangeRates[`iso:USD_${accountIsoFiat}`] = fetchExchangeRateFromCore(state, 'iso:USD', accountIsoFiat)
  }
  for (const id of walletIds) {
    const wallet = wallets[id]
    const walletIsoFiat = wallet.fiatCurrencyCode
    const currencyCode = wallet.currencyInfo.currencyCode // should get GUI or core versions?
    // need to get both forward and backwards exchange rates for wallets & account fiats, for each parent currency AND each token
    exchangeRates[`${currencyCode}_${walletIsoFiat}`] = fetchExchangeRateFromCore(state, currencyCode, walletIsoFiat)
    exchangeRates[`${currencyCode}_${accountIsoFiat}`] = fetchExchangeRateFromCore(state, currencyCode, accountIsoFiat)
    exchangeRates[`${currencyCode}_iso:USD_${yesterdayDate}`] = fetchExchangeRateHistory(currencyCode, yesterdayDate)
    // add them to the list of promises to resolve
    // keep track of the exchange rates
    // now add tokens, if they exist
    if (walletIsoFiat !== 'iso:USD') {
      exchangeRates[`iso:USD_${walletIsoFiat}`] = fetchExchangeRateFromCore(state, 'iso:USD', walletIsoFiat)
    }
    for (const tokenCode in wallet.balances) {
      if (tokenCode !== currencyCode) {
        exchangeRates[`${tokenCode}_${walletIsoFiat}`] = fetchExchangeRateFromCore(state, tokenCode, walletIsoFiat)
        exchangeRates[`${tokenCode}_${accountIsoFiat}`] = fetchExchangeRateFromCore(state, tokenCode, accountIsoFiat)
        exchangeRates[`${tokenCode}_iso:USD_${yesterdayDate}`] = fetchExchangeRateHistory(tokenCode, yesterdayDate)
      }
    }
  }
  const exchangeRateKeys = Object.keys(exchangeRates)
  const exchangeRatePromises = Object.values(exchangeRates)
  const rates = await Promise.all(exchangeRatePromises)
  for (let i = 0; i < exchangeRateKeys.length; i++) {
    const key = exchangeRateKeys[i]
    const codes = key.split('_')
    const rate = rates[i]
    const reverseExchangeRateKey = `${codes[1]}_${codes[0]}${codes[2] ? '_' + codes[2] : ''}`
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
  const { account } = state.core
  const { exchangeCache } = account
  const exchangeRate = exchangeCache.convertCurrency(fromCurrencyCode, toCurrencyCode, 1)
  return Promise.resolve(exchangeRate)
}

export const fetchExchangeRateHistory = async (currency: string, date: string): Promise<number> => {
  const currencyHistory = await fetch(`https://info1.edgesecure.co:8444/v1/exchangeRate?currency_pair=${currency}_USD&date=${date}`).catch(e => {
    console.log('Error fetching fetchExchangeRateHistory', e)
  })
  if (currencyHistory != null) {
    const result = await currencyHistory.json()
    return parseFloat(result.exchangeRate)
  }
  return 0
}
