// @flow

import type { EdgeAccount } from 'edge-core-js'
import { type Reducer } from 'redux'

import type { Action } from '../../../types/reduxTypes.js'

export type AccountState = EdgeAccount | Object

export const initialState: AccountState = {}

const accountReducer = (state = initialState, action: Action) => {
  switch (action.type) {
    case 'ACCOUNT/LOGGED_IN': {
      if (!action.data) throw new Error('Invalid Action')
      return action.data.account
    }

    default:
      return state
  }
}

export const account: Reducer<AccountState, Action> = (state, action: Action) => {
  if (action.type === 'LOGOUT' || action.type === 'DEEP_LINK_RECEIVED') {
    state = undefined
  }
  return accountReducer(state, action)
}
