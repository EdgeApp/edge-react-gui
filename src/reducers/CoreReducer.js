// @flow

import { type Disklet } from 'disklet'
import { type Reducer, combineReducers } from 'redux'

import { type Action } from '../types/reduxTypes.js'
import { type AccountState, account } from './CoreAccountReducer.js'
import { type ContextState, context } from './CoreContextReducer.js'
import { type WalletsState, wallets } from './CoreWalletsReducer.js'
import { type DeepLinkingState, deepLinking } from './DeepLinkingReducer.js'
import { type EdgeLoginState, edgeLogin } from './EdgeLoginReducer.js'

export type CoreState = {
  +disklet: Disklet,

  // Nested reducers:
  +account: AccountState,
  +context: ContextState,
  +wallets: WalletsState,
  +edgeLogin: EdgeLoginState,
  +deepLinking: DeepLinkingState
}

const flowHack: any = {}
const defaultDisklet: Disklet = flowHack

export const core: Reducer<CoreState, Action> = combineReducers({
  disklet (state: Disklet = defaultDisklet, action: Action): Disklet {
    return action.type === 'CORE/CONTEXT/ADD_CONTEXT' ? action.data.disklet : state
  },

  // Nested reducers:
  account,
  context,
  deepLinking,
  edgeLogin,
  wallets
})
