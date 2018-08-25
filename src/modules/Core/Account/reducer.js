// @flow

import type { EdgeAccount } from 'edge-core-js'

import * as Constants from '../../../constants/indexConstants.js'
import type { Action } from '../../ReduxTypes.js'

export const PREFIX = 'ACCOUNT/'

export const LOGGED_IN = PREFIX + 'LOGGED_IN'
export const loggedIn = (account: EdgeAccount) => ({
  type: LOGGED_IN,
  data: { account }
})

export type AccountReducerState = EdgeAccount | {} | void
export const initialState: AccountReducerState = {}
const accountReducer = (state = initialState, action) => {
  switch (action.type) {
    case LOGGED_IN:
      if (!action.data) throw new Error('Invalid Action')
      return action.data.account
    default:
      return state
  }
}

export const account = (state: AccountReducerState, action: Action) => {
  if (action.type === Constants.LOGOUT || action.type === Constants.DEEP_LINK_RECEIVED) {
    state = undefined
  }
  return accountReducer(state, action)
}
