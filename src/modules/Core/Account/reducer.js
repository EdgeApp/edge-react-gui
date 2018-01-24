// @flow

import type { AbcAccount } from 'airbitz-core-types'

import type { Action } from '../../ReduxTypes.js'
import * as Constants from '../../../constants/indexConstants.js'

type AccountReducerState = AbcAccount | {} | void

export const initialState: AccountReducerState = {}

const accountReducer = (state = initialState, action) => {
  switch (action.type) {
    case Constants.ADD_ACCOUNT:
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
