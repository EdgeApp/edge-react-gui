import * as ACTION from './action.js'

const initialState = 0

export const exchangeRates = (state = initialState, action) => {
  const { type } = action

  switch (type) {
  case ACTION.UPDATE_EXCHANGE_RATES:
    return state + 1
  default:
    return state
  }
}
