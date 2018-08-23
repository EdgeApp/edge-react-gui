// @flow

import { combineReducers } from 'redux'

import { OPEN_WALLET_SELECTOR_MODAL, SELECT_FROM_WALLET_CRYPTO_EXCHANGE, SELECT_TO_WALLET_CRYPTO_EXCHANGE } from '../../../../constants/indexConstants'
import { CLOSE_ALL_WALLET_LIST_MODALS } from '../../Wallets/action.js'
import * as ACTION from './action'

const walletListModalVisible = (state = false, action) => {
  switch (action.type) {
    case ACTION.TOGGLE_WALLET_LIST_MODAL_VISIBILITY:
      return !state
    case ACTION.ENABLE_WALLET_LIST_MODAL_VISIBILITY:
      return true
    case ACTION.DISABLE_WALLET_LIST_MODAL_VISIBILITY:
      return false
    case ACTION.TOGGLE_SELECTED_WALLET_LIST_MODAL:
      return false
    case ACTION.TOGGLE_TRANSACTIONS_WALLET_LIST_MODAL:
      return false
    case CLOSE_ALL_WALLET_LIST_MODALS:
      return false
    case OPEN_WALLET_SELECTOR_MODAL:
      return true
    case SELECT_TO_WALLET_CRYPTO_EXCHANGE:
      return false
    case SELECT_FROM_WALLET_CRYPTO_EXCHANGE:
      return false
    default:
      return state
  }
}

export const walletListModal = combineReducers({
  walletListModalVisible
})

export default walletListModal
