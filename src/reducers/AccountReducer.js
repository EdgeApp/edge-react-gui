// @flow

import { type Reducer, combineReducers } from 'redux'

import { type CreationReason } from '../types/CreationReason.js'
import { type Action } from '../types/reduxTypes.js'

/**
 * App state tied to the core account object.
 */
export type AccountState = {
  +creationReason: CreationReason | null
  // TODO: Move account settings in here
}

const accountInner: Reducer<AccountState, Action> = combineReducers({
  creationReason (state: CreationReason | null = null, action: Action): CreationReason | null {
    return action.type === 'CREATION_REASON_LOADED' ? action.data : state
  }
})

// Shared logout logic:
export const account: Reducer<AccountState, Action> = (state: AccountState | void, action: Action) => {
  if (action.type === 'LOGOUT' || action.type === 'DEEP_LINK_RECEIVED') {
    return accountInner(undefined, { type: 'DUMMY_ACTION_PLEASE_IGNORE' })
  }
  return accountInner(state, action)
}
