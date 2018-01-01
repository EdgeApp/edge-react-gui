// @flow

import * as ACTION from './action.js'
import type {Action} from '../../ReduxTypes.js'
import type {AbcAccount} from 'airbitz-core-types'

type AccountReducerState = AbcAccount | {} | void

export const initialState: AccountReducerState = {}

const accountReducer = (state = initialState, action) => {
  switch (action.type) {
  case ACTION.ADD_ACCOUNT:
    if (action.data) {
      return action.data.account
    }
    return state
  default:
    return state
  }
}

export const account = (state: AccountReducerState, action: Action) => {
  if (action.type === 'LOGOUT') {
    state = undefined
  }

  return accountReducer(state, action)
}
