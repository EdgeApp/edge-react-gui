// @flow

import { combineReducers } from 'redux'

const walletListModalVisible = (state = false, action) => {
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

    case 'openWalletSelectorModal': {
      return true
    }

    case 'selectToWalletCryptoExchange': {
      return false
    }

    case 'selectFromWalletCryptoExchange': {
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
