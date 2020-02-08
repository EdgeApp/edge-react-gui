// @flow

import { type Reducer, combineReducers } from 'redux'

import { type Action } from '../types/reduxTypes.js'
import { type AccountState, account } from './CoreAccountReducer.js'
import { type ContextState, context } from './CoreContextReducer.js'
import { type WalletsState, wallets } from './CoreWalletsReducer.js'
import { type DeepLinkingState, deepLinking } from './DeepLinkingReducer.js'
import { type EdgeLoginState, edgeLogin } from './EdgeLoginReducer.js'

export type CoreState = {
  +account: AccountState,
  +context: ContextState,
  +wallets: WalletsState,
  +edgeLogin: EdgeLoginState,
  +deepLinking: DeepLinkingState
}

export const core: Reducer<CoreState, Action> = combineReducers({
  account,
  context,
  deepLinking,
  edgeLogin,
  wallets
})
