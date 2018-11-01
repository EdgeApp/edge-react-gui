// @flow

import type { Action } from '../modules/ReduxTypes.js'

export const initialState = { isActive: false }
export type State = { isActive: boolean }
export const secondaryModal = (state: State = initialState, action: Action) => {
  switch (action.type) {
    case 'PRIVATE_KEY_MODAL/SECONDARY_MODAL/ACTIVATED': {
      return {
        isActive: true
      }
    }

    case 'PRIVATE_KEY_MODAL/SECONDARY_MODAL/DEACTIVATED': {
      return {
        isActive: false
      }
    }

    default:
      return state
  }
}
