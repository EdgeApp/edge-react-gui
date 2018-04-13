/* eslint-disable flowtype/require-valid-file-annotation */

const PREFIX = 'ExchangeRates/'
export const UPDATE_EXCHANGE_RATES = PREFIX + 'UPDATE_EXCHANGE_RATES'
export const updateExchangeRates = () => ({
  type: UPDATE_EXCHANGE_RATES
})
