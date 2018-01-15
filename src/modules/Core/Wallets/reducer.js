import {combineReducers} from 'redux'
import * as ACTION from './action.js'
import * as Constants from '../../../constants/indexConstants'
const initialState = {}
const byId = (state = initialState, action) => {
  const { type, data = {} } = action

  switch (type) {
    case ACTION.UPDATE_WALLETS: {
      const {currencyWallets} = data
      return {
        ...state,
        ...currencyWallets
      }
    }
    default:
      return state
  }
}

export const wallets = (state, action) => {
  if (action.type === Constants.LOGOUT || action.type === Constants.DEEP_LINK_RECEIVED) {
    state = undefined
  }

  return combineReducers({byId})(state, action)
}
