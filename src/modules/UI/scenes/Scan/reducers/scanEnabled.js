// @flow

import type { Action } from '../../../../ReduxTypes.js'

export const initialState = false
export type State = boolean
export const scanEnabled = (state: State = initialState, action: Action) => {
  switch (action.type) {
    case 'ENABLE_SCAN': {
      return true
    }

    case 'PRIVATE_KEY_MODAL/PRIMARY_MODAL/DEACTIVATED': {
      return true
    }

    case 'DISABLE_SCAN': {
      return false
    }

    default:
      return state
  }
}
