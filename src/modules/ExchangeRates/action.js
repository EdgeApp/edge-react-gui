export const PREFIX = 'UI/ExchangeRates/'
export const UPDATE_EXCHANGE_RATES = PREFIX + 'UPDATE_EXCHANGE_RATES'

export const updateExchangeRates = () => {
  return {
    type: UPDATE_EXCHANGE_RATES
  }
}
