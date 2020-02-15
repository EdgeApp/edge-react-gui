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
    switch (action.type) {
      case 'CREATION_REASON_LOADED':
        return action.data
      case 'CREATION_REASON_REMOVE_MESSAGE': {
        if (state == null) return state
        const toRemove = action.data
        const messages = state.appTweaks.messages.filter(message => message !== toRemove)
        return { ...state, appTweaks: { ...state.appTweaks, messages } }
      }
      case 'CREATION_REASON_REMOVE_SWAP': {
        if (state == null) return state
        const plugins = state.appTweaks.plugins.map(plugin => {
          const { preferredSwap = false } = plugin
          if (!preferredSwap) return plugin
          return { ...plugin, preferredSwap: false }
        })
        return { ...state, appTweaks: { ...state.appTweaks, plugins } }
      }
    }
    return state
  }
})

// Shared logout logic:
export const account: Reducer<AccountState, Action> = (state: AccountState | void, action: Action) => {
  if (action.type === 'LOGOUT' || action.type === 'DEEP_LINK_RECEIVED') {
    return accountInner(undefined, { type: 'DUMMY_ACTION_PLEASE_IGNORE' })
  }
  return accountInner(state, action)
}
