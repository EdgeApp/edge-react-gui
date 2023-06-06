import { div, toFixed } from 'biggystring'
import { EdgeDataStore } from 'edge-core-js'
import { sprintf } from 'sprintf-js'

import { formatNumber } from '../../locales/intl'
import { lstrings } from '../../locales/strings'
import { FiatProviderError, FiatProviderQuote, FiatProviderQuoteError, FiatProviderQuoteErrorTypes, FiatProviderStore } from './fiatProviderTypes'

export const createStore = (storeId: string, store: EdgeDataStore): FiatProviderStore => {
  return {
    deleteItem: async (itemId: string) => await store.deleteItem(storeId, itemId),
    listItemIds: async () => await store.listItemIds(storeId),
    getItem: async (itemId: string) => await store.getItem(storeId, itemId),
    setItem: async (itemId: string, value: string) => await store.setItem(storeId, itemId, value)
  }
}

const ERROR_PRIORITIES: { [errorType in FiatProviderQuoteErrorTypes]: number } = {
  underLimit: 1,
  overLimit: 2,
  paymentUnsupported: 3,
  regionRestricted: 4,
  assetUnsupported: 5
}

export const getRateFromQuote = (quote: FiatProviderQuote, fiatCode: string): string => {
  const bestRate = div(quote.fiatAmount, quote.cryptoAmount, 16)
  const localeRate = formatNumber(toFixed(bestRate, 0, 2))
  const exchangeRateText = `1 ${quote.displayCurrencyCode} = ${localeRate} ${fiatCode}`
  return exchangeRateText
}

export const getBestError = (errorQuotes: FiatProviderError[], currencyCode: string): string | undefined => {
  let bestError: FiatProviderQuoteError | undefined
  for (const eq of errorQuotes) {
    const errorQuote = eq.quoteError
    if (errorQuote == null) continue
    if (bestError == null) {
      bestError = errorQuote
      continue
    }
    if (ERROR_PRIORITIES[errorQuote.errorType] < ERROR_PRIORITIES[bestError.errorType]) {
      bestError = errorQuote
      continue
    }
    if (ERROR_PRIORITIES[errorQuote.errorType] === ERROR_PRIORITIES[bestError.errorType]) {
      if (errorQuote.errorType === 'overLimit' && bestError.errorType === 'overLimit') {
        if ((errorQuote.errorAmount ?? 0) > (bestError.errorAmount ?? 0)) {
          bestError = errorQuote
        }
      } else if (errorQuote.errorType === 'underLimit' && bestError.errorType === 'underLimit') {
        if ((errorQuote.errorAmount ?? Infinity) < (bestError.errorAmount ?? Infinity)) {
          bestError = errorQuote
        }
      }
    }
  }
  if (bestError == null) return
  return getErrorText(bestError, currencyCode)
}

const getErrorText = (error: FiatProviderQuoteError, currencyCode: string): string => {
  let errorText = ''

  switch (error.errorType) {
    case 'underLimit':
      errorText =
        error.errorAmount == null
          ? lstrings.fiat_plugin_buy_amount_under_undef_limit
          : sprintf(lstrings.fiat_plugin_buy_amount_under_limit, `${formatNumber(error.errorAmount.toString())} ${currencyCode}`)
      break
    case 'overLimit':
      errorText =
        error.errorAmount == null
          ? lstrings.fiat_plugin_buy_amount_over_undef_limit
          : sprintf(lstrings.fiat_plugin_buy_amount_over_limit, `${formatNumber(error.errorAmount.toString())} ${currencyCode}`)
      break
    case 'paymentUnsupported':
      errorText = lstrings.fiat_plugin_payment_unsupported
      break
    case 'regionRestricted':
      errorText = sprintf(lstrings.fiat_plugin_buy_region_restricted, error.displayCurrencyCode)
      break
    case 'assetUnsupported':
      errorText = lstrings.fiat_plugin_asset_unsupported
      break
    default:
      errorText = 'Unknown error type'
  }

  return errorText
}

export const debugSpewStore = async (store: EdgeDataStore): Promise<void> => {
  const theStore = {}
  const storeIds = await store.listStoreIds()
  for (const storeId of storeIds) {
    // @ts-expect-error
    theStore[storeId] = {}
    const keys = await store.listItemIds(storeId)
    for (const key of keys) {
      const data = await store.getItem(storeId, key)
      // @ts-expect-error
      theStore[storeId][key] = data
    }
  }
  console.log('*** theStore ***')
  console.log(JSON.stringify(theStore, null, 2))
}
