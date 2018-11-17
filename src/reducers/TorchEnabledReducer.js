// @flow

import type { Action } from '../modules/ReduxTypes.js'

export const initialState = false
export type State = boolean
export const torchEnabled = (state: State = initialState, action: Action) => {
  switch (action.type) {
    case 'TOGGLE_ENABLE_TORCH': {
      return !state
    }

    default:
      return state
  }
}
