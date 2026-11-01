import type { ExchangeInfo } from '../actions/ExchangeInfoActions'
import type { Action } from '../types/reduxTypes'

export const initialState: ExchangeInfo = {
  buy: {
    disablePlugins: {},
    newPaymentTypes: {}
  },
  sell: {
    disablePlugins: {},
    newPaymentTypes: {}
  },
  swap: {
    disableAssets: {
      source: [],
      destination: []
    },
    disableAssetsByPlugin: {},
    disablePlugins: {}
  }
}

export const exchangeInfo = (
  state: ExchangeInfo = initialState,
  action: Action
): ExchangeInfo => {
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
