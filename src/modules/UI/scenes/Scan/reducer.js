// @flow

import { combineReducers } from 'redux'

import type { Action } from '../../../ReduxTypes.js'
import * as Constants from '../../../../constants/indexConstants'
import * as WALLET_LIST_MODAL_ACTION from '../../components/WalletListModal/action'
import * as ACTION from './action'

const torchEnabled = (state: boolean = false, action: Action) => {
  switch (action.type) {
    case ACTION.TOGGLE_ENABLE_TORCH:
      return !state
    default:
      return state
  }
}

const addressModalVisible = (state: boolean = false, action: Action) => {
  switch (action.type) {
    case Constants.SAVE_ABC_LOBBY:
    case Constants.SET_LOBBY_ERROR:
      return false
    case ACTION.TOGGLE_ADDRESS_MODAL_VISIBILITY:
      return !state
    default:
      return state
  }
}

const recipientAddress = (state = '', action: Action) => {
  switch (action.type) {
    case ACTION.UPDATE_RECIPIENT_ADDRESS:
      return action.data
    default:
      return state
  }
}

const scanEnabled = (state: boolean = false, action: Action) => {
  switch (action.type) {
    case ACTION.ENABLE_SCAN:
      return true
    case ACTION.DISABLE_SCAN:
      return false
    default:
      return state
  }
}

const selectedWalletListModalVisibility = (state: boolean = false, action: Action) => {
  switch (action.type) {
    case WALLET_LIST_MODAL_ACTION.TOGGLE_SELECTED_WALLET_LIST_MODAL:
      return !state
    case WALLET_LIST_MODAL_ACTION.TOGGLE_SCAN_TO_WALLET_LIST_MODAL:
      return false
    case WALLET_LIST_MODAL_ACTION.TOGGLE_TRANSACTIONS_WALLET_LIST_MODAL:
      return false
    case ACTION.TOGGLE_ADDRESS_MODAL_VISIBILITY:
      return false
    case WALLET_LIST_MODAL_ACTION.DISABLE_WALLET_LIST_MODAL_VISIBILITY:
      return false
    default:
      return state
  }
}

const scanToWalletListModalVisibility = (state: boolean = false, action: Action) => {
  switch (action.type) {
    case WALLET_LIST_MODAL_ACTION.TOGGLE_SCAN_TO_WALLET_LIST_MODAL:
      return !state
    case WALLET_LIST_MODAL_ACTION.TOGGLE_SELECTED_WALLET_LIST_MODAL:
      return false
    case WALLET_LIST_MODAL_ACTION.TOGGLE_TRANSACTIONS_WALLET_LIST_MODAL:
      return false
    case ACTION.TOGGLE_ADDRESS_MODAL_VISIBILITY:
      return false
    case WALLET_LIST_MODAL_ACTION.DISABLE_WALLET_LIST_MODAL_VISIBILITY:
      return false
    default:
      return state
  }
}

export const scan = combineReducers({
  torchEnabled,
  addressModalVisible,
  recipientAddress,
  scanEnabled,
  selectedWalletListModalVisibility,
  scanToWalletListModalVisibility
})

export default scan
