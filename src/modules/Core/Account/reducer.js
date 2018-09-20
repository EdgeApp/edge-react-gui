// @flow

import type { EdgeAccount } from 'edge-core-js'

import type { Action } from '../../ReduxTypes.js'

export const loggedIn = (account: EdgeAccount) => ({
  type: 'ACCOUNT/LOGGED_IN',
  data: { account }
})

export type AccountReducerState = EdgeAccount | {} | void
export const initialState: AccountReducerState = {}
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

export const account = (state: AccountReducerState, action: Action) => {
  if (action.type === 'LOGOUT' || action.type === 'DEEP_LINK_RECEIVED') {
    state = undefined
  }
  return accountReducer(state, action)
}
