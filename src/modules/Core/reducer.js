// @flow

import { combineReducers } from 'redux'

import { context } from './Context/reducer.js'
import { account } from './Account/reducer.js'
import { wallets } from './Wallets/reducer.js'
import EdgeLoginReducer from '../../reducers/core/EdgeLoginReducer'
import DeepLinkingReducer from '../../reducers/core/DeepLinkingReducer'

export const core = combineReducers({
  context,
  account,
  wallets,
  edgeLogin: EdgeLoginReducer,
  deepLinking: DeepLinkingReducer
})
