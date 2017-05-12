export const UPDATE_EXCHANGE_RATES = 'UPDATE_EXCHANGE_RATES'

const fakeExchangeRate = {
    "USD": {
        "TRD": 541, 
        "BTC": 1883, 
        "LTC": 27.36, 
        "ETH": 94
    }
}

export const updateExchangeRates = () => {
    return {
        type: UPDATE_EXCHANGE_RATES,
        data: fakeExchangeRate
    }
}