// @flow

import type { Action } from '../../../../ReduxTypes.js'

import * as ACTION from '../action'

export const initialState = ''
export type State = string
export const recipientAddress = (state: State = initialState, action: Action) => {
  switch (action.type) {
    case ACTION.UPDATE_RECIPIENT_ADDRESS:
      return action.data
    default:
      return state
  }
}
