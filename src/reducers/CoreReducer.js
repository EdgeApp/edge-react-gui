// @flow

import { type Disklet } from 'disklet'
import { type EdgeAccount, type EdgeContext } from 'edge-core-js/types'
import { type Reducer, combineReducers } from 'redux'

import { type Action } from '../types/reduxTypes.js'
import { type EdgeLoginState, edgeLogin } from './EdgeLoginReducer.js'

export type CoreState = {
  +account: EdgeAccount,
  +context: EdgeContext,
  +disklet: Disklet,

  // Nested reducers:
  +edgeLogin: EdgeLoginState
}

const flowHack: any = {}
const defaultAccount: EdgeAccount = flowHack
const defaultContext: EdgeContext = flowHack
const defaultDisklet: Disklet = flowHack

export const core: Reducer<CoreState, Action> = combineReducers({
  account (state: EdgeAccount = defaultAccount, action: Action): EdgeAccount {
    switch (action.type) {
      case 'LOGIN':
        return action.data
      case 'LOGOUT':
        return defaultAccount
    }
    return state
  },

  context (state: EdgeContext = defaultContext, action: Action): EdgeContext {
    return action.type === 'CORE/CONTEXT/ADD_CONTEXT' ? action.data.context : state
  },

  disklet (state: Disklet = defaultDisklet, action: Action): Disklet {
    return action.type === 'CORE/CONTEXT/ADD_CONTEXT' ? action.data.disklet : state
  },

  // Nested reducers:
  edgeLogin
})
