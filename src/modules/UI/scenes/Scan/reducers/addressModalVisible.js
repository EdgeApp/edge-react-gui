// @flow

import type { Action } from '../../../../ReduxTypes.js'

export const initialState = false
export type State = boolean
export const addressModalVisible = (state: State = initialState, action: Action) => {
  switch (action.type) {
    case 'SAVE_EDGE_LOBBY':
    case 'SET_LOBBY_ERROR': {
      return false
    }

    case 'TOGGLE_ADDRESS_MODAL_VISIBILITY': {
      return !state
    }

    default:
      return state
  }
}
