// @flow

import { type Disklet } from 'disklet'
import { type EdgeContext } from 'edge-core-js/types'
import { type Reducer, combineReducers } from 'redux'

import { type Action } from '../types/reduxTypes.js'
import { type AccountState, account } from './CoreAccountReducer.js'
import { type WalletsState, wallets } from './CoreWalletsReducer.js'
import { type DeepLinkingState, deepLinking } from './DeepLinkingReducer.js'
import { type EdgeLoginState, edgeLogin } from './EdgeLoginReducer.js'

export type CoreState = {
  +context: EdgeContext,
  +disklet: Disklet,

  // Nested reducers:
  +account: AccountState,
  +wallets: WalletsState,
  +edgeLogin: EdgeLoginState,
  +deepLinking: DeepLinkingState
}

const flowHack: any = {}
const defaultContext: EdgeContext = flowHack
const defaultDisklet: Disklet = flowHack

export const core: Reducer<CoreState, Action> = combineReducers({
  context (state: EdgeContext = defaultContext, action: Action): EdgeContext {
    return action.type === 'CORE/CONTEXT/ADD_CONTEXT' ? action.data.context : state
  },

  disklet (state: Disklet = defaultDisklet, action: Action): Disklet {
    return action.type === 'CORE/CONTEXT/ADD_CONTEXT' ? action.data.disklet : state
  },

  // Nested reducers:
  account,
  deepLinking,
  edgeLogin,
  wallets
})
