import * as ACTION from './action.js'

const initialState = 0
const exchangeRatesReducer = (state = initialState, action) => {
  const {type} = action

  switch (type) {
  case ACTION.UPDATE_EXCHANGE_RATES:
    return state + 1
  default:
    return state
  }
}

export const exchangeRates = (state, action) => {
  if (action.type === 'LOGOUT') {
    state = undefined
  }

  return exchangeRatesReducer(state, action)
}
