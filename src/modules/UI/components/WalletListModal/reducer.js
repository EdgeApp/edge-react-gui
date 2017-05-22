import * as ACTION from './action'
import { combineReducers } from 'redux'

const walletListModalVisible = (state = false, action) => {
  switch (action.type) {
    case ACTION.TOGGLE_WALLET_LIST_MODAL_VISIBILITY :
      return !state
    case ACTION.ENABLE_WALLET_LIST_MODAL_VISIBILITY :
      return true
    case ACTION.DISABLE_WALLET_LIST_MODAL_VISIBILITY :
      return false
    default :
      return state
  }
}

const walletListModal = combineReducers({
    walletListModalVisible
})

export default walletListModal
