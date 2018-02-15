// @flow

import { combineReducers } from 'redux'

import DeepLinkingReducer from '../../reducers/core/DeepLinkingReducer'
import EdgeLoginReducer from '../../reducers/core/EdgeLoginReducer'
import { account } from './Account/reducer.js'
import { context } from './Context/reducer.js'
import { wallets } from './Wallets/reducer.js'

export const core = combineReducers({
  context,
  account,
  wallets,
  edgeLogin: EdgeLoginReducer,
  deepLinking: DeepLinkingReducer
})
