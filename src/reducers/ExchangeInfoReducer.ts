import { ExchangeInfo } from '../actions/ExchangeInfoActions'
import { Action } from '../types/reduxTypes'

export const initialState: ExchangeInfo = {
  buy: {
    disablePlugins: {}
  },
  sell: {
    disablePlugins: {}
  },
  swap: {
    disableAssets: {
      source: [],
      destination: []
    },
    disablePlugins: {}
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
