import {combineReducers} from 'redux'
import {context} from './Context/reducer.js'
import {account} from './Account/reducer.js'
import {wallets} from './Wallets/reducer.js'
import EdgeLoginReducer from '../../reducers/core/EdgeLoginReducer'
// import exchangeRates from './ExchangeRates/reducer.js'

export const core = combineReducers({
  context,
  account,
  wallets,
  edgeLogin: EdgeLoginReducer
  // exchangeRates
})
