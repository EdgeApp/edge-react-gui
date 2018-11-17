// @flow

import type { Action } from '../modules/ReduxTypes.js'

export const initialState = false
export type State = boolean
export const addressModalVisibleReducer = (state: State = initialState, action: Action) => {
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
