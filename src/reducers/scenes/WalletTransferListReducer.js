// @flow

import { type Reducer, combineReducers } from 'redux'

import type { Action } from '../../modules/ReduxTypes.js'

export type WalletTransferListState = {
  +walletTransferList: Array<any>,
  +walletListModalVisible: boolean
}

const walletTransferListReducer = (state = [], action: Action): Array<any> => {
  switch (action.type) {
    case 'UPDATE_WALLET_TRANSFER_LIST': {
      if (action.data == null) throw new TypeError('Invalid action')
      return action.data
    }

    default:
      return state
  }
}

const walletListModalVisible = (state = false, action: Action): boolean => {
  switch (action.type) {
    case 'TOGGLE_WALLET_LIST_MODAL_VISIBILITY': {
      return !state
    }

    default:
      return state
  }
}

export const walletTransferList: Reducer<WalletTransferListState, Action> = combineReducers({
  walletTransferList: walletTransferListReducer,
  walletListModalVisible
})
