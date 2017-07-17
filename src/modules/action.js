export const PREFIX = 'UI/'
export const UPDATE_EXCHANGE_RATES = PREFIX + 'UPDATE_EXCHANGE_RATES'

export const updateExchangeRates = () => {
  return {
    type: UPDATE_EXCHANGE_RATES
  }
}
