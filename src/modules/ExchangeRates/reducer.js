import * as ACTION from './action.js'
import * as Constants from '../../constants/indexConstants'
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
  if (action.type === Constants.LOGOUT || action.type === Constants.DEEP_LINK_RECEIVED) {
    state = undefined
  }

  return exchangeRatesReducer(state, action)
}
