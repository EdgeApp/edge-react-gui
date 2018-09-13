// @flow

import { combineReducers } from 'redux'

import type { Action } from '../../../ReduxTypes.js'

const walletTransferList = (state = [], action: Action) => {
  switch (action.type) {
    case 'UPDATE_WALLET_TRANSFER_LIST': {
      return action.data
    }

    default:
      return state
  }
}

const walletListModalVisible = (state = false, action: Action) => {
  switch (action.type) {
    case 'TOGGLE_WALLET_LIST_MODAL_VISIBILITY': {
      return !state
    }

    default:
      return state
  }
}

export const walletTransferListReducer = combineReducers({
  walletTransferList,
  walletListModalVisible
})

export default walletTransferListReducer
