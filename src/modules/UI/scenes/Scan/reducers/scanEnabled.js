// @flow

import type { Action } from '../../../../ReduxTypes.js'

import * as ACTION from '../action'

export const initialState = false
export type State = boolean
export const scanEnabled = (state: State = initialState, action: Action) => {
  switch (action.type) {
    case ACTION.ENABLE_SCAN:
      return true
    case ACTION.DISABLE_SCAN:
      return false
    default:
      return state
  }
}
