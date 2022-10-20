import { div, eq } from 'biggystring'
import { asArray, asEither, asNull, asObject, asString } from 'cleaners'

import { RootState, ThunkAction } from '../types/reduxTypes'
import { GuiExchangeRates } from '../types/types'
import { fetchRates } from '../util/network'
import { DECIMAL_PRECISION, getYesterdayDateRoundDownHour } from '../util/utils'

const RATES_SERVER_MAX_QUERY_SIZE = 100
const HOUR_MS = 1000 * 60 * 60

const asRatesResponse = asObject({
  data: asArray(
    asObject({
      currency_pair: asString,
      date: asString,
      exchangeRate: asEither(asString, asNull)
    })
  )
})

export function updateExchangeRates(): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState()
    const exchangeRates = await buildExchangeRates(state)
    dispatch({
      type: 'EXCHANGE_RATES/UPDATE_EXCHANGE_RATES',
      data: { exchangeRates }
    })
  }
}

async function buildExchangeRates(state: RootState): Promise<GuiExchangeRates> {
  const { account } = state.core
  const { currencyWallets } = account

  const accountIsoFiat = state.ui.settings.defaultIsoFiat

  const exchangeRates: Array<{ currency_pair: string; date?: string }> = []
  const yesterdayDate = getYesterdayDateRoundDownHour()
  if (accountIsoFiat !== 'iso:USD') {
    exchangeRates.push({ currency_pair: `iso:USD_${accountIsoFiat}` })
  }
  for (const id of Object.keys(currencyWallets)) {
    const wallet = currencyWallets[id]
    const walletIsoFiat = wallet.fiatCurrencyCode
    const currencyCode = wallet.currencyInfo.currencyCode
    // need to get both forward and backwards exchange rates for wallets & account fiats, for each parent currency AND each token
    exchangeRates.push({ currency_pair: `${currencyCode}_${walletIsoFiat}` })
    exchangeRates.push({ currency_pair: `${currencyCode}_${accountIsoFiat}` })
    exchangeRates.push({ currency_pair: `${currencyCode}_iso:USD`, date: `${yesterdayDate}` })
    // now add tokens, if they exist
    if (walletIsoFiat !== 'iso:USD') {
      exchangeRates.push({ currency_pair: `iso:USD_${walletIsoFiat}` })
    }
    for (const tokenId of wallet.enabledTokenIds) {
      const { currencyCode: tokenCode } = wallet.currencyConfig.allTokens[tokenId]
      if (tokenCode !== currencyCode) {
        exchangeRates.push({ currency_pair: `${tokenCode}_${walletIsoFiat}` })
        exchangeRates.push({ currency_pair: `${tokenCode}_${accountIsoFiat}` })
        exchangeRates.push({ currency_pair: `${tokenCode}_iso:USD`, date: `${yesterdayDate}` })
      }
    }
  }

  // Remove duplicates
  const filteredExchangeRates = exchangeRates.filter((v, i, a) => a.findIndex(v2 => v2.currency_pair === v.currency_pair && v2.date === v.date) === i)

  const serverRates: GuiExchangeRates = { 'iso:USD_iso:USD': '1' }
  while (filteredExchangeRates.length > 0) {
    const query = filteredExchangeRates.splice(0, RATES_SERVER_MAX_QUERY_SIZE)
    let tries = 5
    do {
      const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: query })
      }
      try {
        const response = await fetchRates('v2/exchangeRates', options)
        if (response.ok) {
          const json = await response.json()
          const cleanedRates = asRatesResponse(json)
          for (const rate of cleanedRates.data) {
            const { currency_pair: currencyPair, exchangeRate, date } = rate
            const newDate = new Date(date).valueOf()
            const now = Date.now()

            const key = now - newDate > HOUR_MS ? `${currencyPair}_${date}` : currencyPair
            serverRates[key] = exchangeRate ?? '0'

            const codes = key.split('_')
            const reverseExchangeRateKey = `${codes[1]}_${codes[0]}${codes[2] ? '_' + codes[2] : ''}`
            if (serverRates[reverseExchangeRateKey] == null) {
              if (eq(serverRates[key], '0')) {
                serverRates[reverseExchangeRateKey] = '0'
              } else {
                serverRates[reverseExchangeRateKey] = div('1', serverRates[key], DECIMAL_PRECISION)
              }
            }
          }
          break
        }
      } catch (e: any) {
        console.log(`buildExchangeRates error querying rates server ${e.message}`)
      }
    } while (--tries > 0)
  }

  return serverRates
}
