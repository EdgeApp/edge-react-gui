import * as ACTION from './action'
import * as WALLET_LIST_MODAL_ACTION from '../../components/WalletListModal/action'
import {combineReducers} from 'redux'

const torchEnabled = (state = false, action) => {
  switch (action.type) {
    case ACTION.TOGGLE_ENABLE_TORCH :
      return !state
    default:
      return state
  }
}

const addressModalVisible = (state = false, action) => {
  switch (action.type) {
    case ACTION.TOGGLE_ADDRESS_MODAL_VISIBILITY:
      return !state
    default:
      return state
  }
}

const recipientAddress = (state = '', action) => {
  switch (action.type) {
    case ACTION.UPDATE_RECIPIENT_ADDRESS:
      return action.data
    default:
      return state
  }
}

const scanFromWalletListModalVisibility = (state = false, action) => {
  switch (action.type) {
    case WALLET_LIST_MODAL_ACTION.TOGGLE_SCAN_FROM_WALLET_LIST_MODAL :
      return !state
    default: 
      return state
  }
}

const scanToWalletListModalVisibility = (state = false, action) => {
  switch (action.type) {
    case WALLET_LIST_MODAL_ACTION.TOGGLE_SCAN_TO_WALLET_LIST_MODAL :
      return !state
    default: 
      return state
  }
}

const scan = combineReducers({
  torchEnabled,
  addressModalVisible,
  recipientAddress,
  scanFromWalletListModalVisibility,
  scanToWalletListModalVisibility
})

export default scan