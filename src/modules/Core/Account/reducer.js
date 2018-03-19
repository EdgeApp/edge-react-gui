// @flow

import type { EdgeAccount } from 'edge-core-js'

import * as Constants from '../../../constants/indexConstants.js'
import type { Action } from '../../ReduxTypes.js'

type AccountReducerState = EdgeAccount | {} | void

export const initialState: AccountReducerState = {}

const accountReducer = (state = initialState, action) => {
  switch (action.type) {
    case Constants.ACCOUNT_INIT_COMPLETE:
      if (action.data) {
        return action.data.account
      }
      return state
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
