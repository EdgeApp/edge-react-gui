// @flow

import type { Action } from '../types/reduxTypes.js'

export const initialState = false
export type State = boolean
export const scanEnabled = (state: State = initialState, action: Action) => {
  switch (action.type) {
    case 'ENABLE_SCAN':
    case 'PRIVATE_KEY_MODAL/SWEEP_PRIVATE_KEY_FAIL':
    case 'PRIVATE_KEY_MODAL/SWEEP_PRIVATE_KEY_SUCCESS': {
      return true
    }

    case 'DISABLE_SCAN': {
      return false
    }

    default:
      return state
  }
}
