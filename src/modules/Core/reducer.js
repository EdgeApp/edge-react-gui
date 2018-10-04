// @flow

import { type Reducer, combineReducers } from 'redux'

import { type DeepLinkingState, deepLinking } from '../../reducers/core/DeepLinkingReducer.js'
import { type EdgeLoginState, edgeLogin } from '../../reducers/core/EdgeLoginReducer.js'
import { type Action } from '../ReduxTypes.js'
import { type AccountState, account } from './Account/reducer.js'
import { type ContextState, context } from './Context/reducer.js'
import { type WalletsState, wallets } from './Wallets/reducer.js'

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
