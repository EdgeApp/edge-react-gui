// @flow

import type { Action } from '../../../../ReduxTypes.js'

export const initialState = false
export type State = boolean
export const scanToWalletListModalVisibility = (state: State = initialState, action: Action) => {
  switch (action.type) {
    case 'TOGGLE_SCAN_TO_WALLET_LIST_MODAL': {
      return !state
    }

    case 'TOGGLE_SELECTED_WALLET_LIST_MODAL': {
      return false
    }

    case 'TOGGLE_TRANSACTIONS_WALLET_LIST_MODAL': {
      return false
    }

    case 'TOGGLE_ADDRESS_MODAL_VISIBILITY': {
      return false
    }

    case 'DISABLE_WALLET_LIST_MODAL_VISIBILITY': {
      return false
    }

    default:
      return state
  }
}
