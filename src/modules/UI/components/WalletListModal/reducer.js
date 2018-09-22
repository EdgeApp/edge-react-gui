// @flow

import { combineReducers } from 'redux'

import { type Action } from '../../../ReduxTypes.js'

const walletListModalVisible = (state = false, action: Action) => {
  switch (action.type) {
    case 'TOGGLE_WALLET_LIST_MODAL_VISIBILITY': {
      return !state
    }

    case 'ENABLE_WALLET_LIST_MODAL_VISIBILITY': {
      return true
    }

    case 'DISABLE_WALLET_LIST_MODAL_VISIBILITY': {
      return false
    }

    case 'TOGGLE_SELECTED_WALLET_LIST_MODAL': {
      return false
    }

    case 'TOGGLE_TRANSACTIONS_WALLET_LIST_MODAL': {
      return false
    }

    case 'CLOSE_ALL_WALLET_LIST_MODALS': {
      return false
    }

    case 'OPEN_WALLET_SELECTOR_MODAL': {
      return true
    }

    case 'SELECT_TO_WALLET_CRYPTO_EXCHANGE': {
      return false
    }

    case 'SELECT_FROM_WALLET_CRYPTO_EXCHANGE': {
      return false
    }

    case 'UPDATE_CURRENT_SCENE_KEY': {
      return false
    }

    default:
      return state
  }
}

export const walletListModal = combineReducers({
  walletListModalVisible
})

export default walletListModal
