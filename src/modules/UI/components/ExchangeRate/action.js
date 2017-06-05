export const UPDATE_EXCHANGE_RATES = 'UPDATE_EXCHANGE_RATES'

let randomSeed = Math.random() //produces random number between 0 and 1

const fakeExchangeRate = [
    {source: 'TRD', dest: 'USD', value: 1 + randomSeed},
    {source: 'USD', dest: 'TRD', value: 1 / (1 + randomSeed)}
]

export const updateExchangeRates = () => {
    return {
        type: UPDATE_EXCHANGE_RATES,
        data: fakeExchangeRate
    }
}