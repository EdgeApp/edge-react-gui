import { combineReducers } from 'redux'
import * as ACTION from './action.js'

const byId = (state = {}, action) =>
  action.type === ACTION.UPDATE_WALLETS ? action.data.currencyWallets : state

export const wallets = combineReducers({ byId })
