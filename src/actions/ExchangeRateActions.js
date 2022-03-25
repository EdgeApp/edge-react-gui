// @flow

import { div } from 'biggystring'

import { type Dispatch, type GetState, type RootState } from '../types/reduxTypes.js'
import { type GuiExchangeRates } from '../types/types.js'
import { DECIMAL_PRECISION, getYesterdayDateRoundDownHour } from '../util/utils.js'

export const updateExchangeRates = () => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const exchangeRates = await buildExchangeRates(state)
  dispatch({
    type: 'EXCHANGE_RATES/UPDATE_EXCHANGE_RATES',
    data: { exchangeRates }
  })
}

async function buildExchangeRates(state: RootState): GuiExchangeRates {
  const { account } = state.core
  const { currencyWallets, rateCache } = account
  const accountIsoFiat = state.ui.settings.defaultIsoFiat

  const exchangeRates: { [pair: string]: Promise<number> } = {}
  const finalExchangeRates: GuiExchangeRates = {}
  const yesterdayDate = getYesterdayDateRoundDownHour()
  if (accountIsoFiat !== 'iso:USD') {
    exchangeRates[`iso:USD_${accountIsoFiat}`] = rateCache.convertCurrency('iso:USD', accountIsoFiat)
  }
  for (const id of Object.keys(currencyWallets)) {
    const wallet = currencyWallets[id]
    const walletIsoFiat = wallet.fiatCurrencyCode
    const currencyCode = wallet.currencyInfo.currencyCode // should get GUI or core versions?
    // need to get both forward and backwards exchange rates for wallets & account fiats, for each parent currency AND each token
    exchangeRates[`${currencyCode}_${walletIsoFiat}`] = rateCache.convertCurrency(currencyCode, walletIsoFiat)
    exchangeRates[`${currencyCode}_${accountIsoFiat}`] = rateCache.convertCurrency(currencyCode, accountIsoFiat)
    exchangeRates[`${currencyCode}_iso:USD_${yesterdayDate}`] = fetchExchangeRateHistory(currencyCode, yesterdayDate)
    // add them to the list of promises to resolve
    // keep track of the exchange rates
    // now add tokens, if they exist
    if (walletIsoFiat !== 'iso:USD') {
      exchangeRates[`iso:USD_${walletIsoFiat}`] = rateCache.convertCurrency('iso:USD', walletIsoFiat)
    }
    for (const tokenCode of Object.keys(wallet.balances)) {
      if (tokenCode !== currencyCode) {
        exchangeRates[`${tokenCode}_${walletIsoFiat}`] = rateCache.convertCurrency(tokenCode, walletIsoFiat)
        exchangeRates[`${tokenCode}_${accountIsoFiat}`] = rateCache.convertCurrency(tokenCode, accountIsoFiat)
        exchangeRates[`${tokenCode}_iso:USD_${yesterdayDate}`] = fetchExchangeRateHistory(tokenCode, yesterdayDate)
      }
    }
  }
  const exchangeRateKeys = Object.keys(exchangeRates)
  const exchangeRatePromises = Object.values(exchangeRates)
  // Promise.allSettled() is the correct function for this but somehow not included in Promise
  const rates = await Promise.all(
    exchangeRatePromises.map(promise =>
      // $FlowExpectedError - Object.values() always produce mixed type so .catch will produce error
      promise.catch(e => {
        console.log(e)
        return 0
      })
    )
  )

  for (let i = 0; i < exchangeRateKeys.length; i++) {
    const key = exchangeRateKeys[i]
    const codes = key.split('_')
    const reverseExchangeRateKey = `${codes[1]}_${codes[0]}${codes[2] ? '_' + codes[2] : ''}`
    const rate = rates[i]
    finalExchangeRates[key] = '0'
    finalExchangeRates[reverseExchangeRateKey] = '0'

    if (rate != null && !isNaN(rate) && rate !== 0) {
      const rateStr = rate.toFixed(DECIMAL_PRECISION)
      finalExchangeRates[key] = rateStr
      finalExchangeRates[reverseExchangeRateKey] = div('1', rateStr, DECIMAL_PRECISION)
    }
  }

  return finalExchangeRates
}

async function fetchExchangeRateHistory(currency: string, date: string): Promise<number> {
  try {
    const currencyHistory = await fetch(`https://rates1.edge.app/v1/exchangeRate?currency_pair=${currency}_USD&date=${date}`).catch(e => {
      console.log('Error fetching fetchExchangeRateHistory', e)
    })
    if (currencyHistory != null) {
      const result = await currencyHistory.json()
      return parseFloat(result.exchangeRate)
    }
  } catch (e) {
    console.log('fetchExchangeRateHistory', e)
  }
  return 0
}
