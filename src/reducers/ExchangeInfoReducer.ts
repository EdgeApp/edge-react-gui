import { ExchangeInfo } from '../actions/ExchangeInfoActions'
import { Action } from '../types/reduxTypes'

const initialState: ExchangeInfo = {
  swap: {
    disableAssets: {
      source: [],
      destination: []
    }
  }
}

export const exchangeInfo = (state: ExchangeInfo = initialState, action: Action) => {
  switch (action.type) {
    case 'UPDATE_EXCHANGE_INFO': {
      return {
        ...state,
        ...action.data
      }
    }
    default:
      return state
  }
}
