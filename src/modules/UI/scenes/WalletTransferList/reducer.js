/* eslint-disable flowtype/require-valid-file-annotation */

import { combineReducers } from 'redux'

import * as ACTION from './action'

const walletTransferList = (state = [], action) => {
  switch (action.type) {
    case ACTION.UPDATE_WALLET_TRANSFER_LIST:
      return action.data
    default:
      return state
  }
}

const walletListModalVisible = (state = false, action) => {
  switch (action.type) {
    case ACTION.TOGGLE_WALLET_LIST_MODAL_VISIBILITY:
      return !state
    default:
      return state
  }
}

export const walletTransferListReducer = combineReducers({
  walletTransferList,
  walletListModalVisible
})

export default walletTransferListReducer
