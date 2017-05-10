import * as WALLET_LIST_ACTION from './WalletList.action'
import * as WALLET_ACTION from '../UI/Wallets/Wallets.action'
import { combineReducers } from 'redux'

const renameWalletVisible = (state = false, action) => {
  switch (action.type) {
    case WALLET_LIST_ACTION.OPEN_RENAME_WALLET_MODAL :
      return true
    case WALLET_LIST_ACTION.CLOSE_RENAME_WALLET_MODAL :
      return false
    case WALLET_LIST_ACTION.COMPLETE_RENAME_WALLET :
      return false
    default :
      return state
  }
}

const deleteWalletVisible = (state = false, action) => {
  switch (action.type) {
    case WALLET_LIST_ACTION.START_DELETE_WALLET :
      return true
    case WALLET_ACTION.COMPLETE_DELETE_WALLET :
      return false
    case WALLET_LIST_ACTION.CLOSE_DELETE_WALLET_MODAL :
      return false
    default :
      return state
  }
}

const archiveList = (state = [], action) => {
  switch (action.type) {
    case WALLET_LIST_ACTION.UPDATE_ARCHIVE_LIST_ORDER:
      return action.data
    default:
      return state
  }
}

const archiveVisible = (state = false, action) => {
  switch (action.type) {
    case WALLET_LIST_ACTION.TOGGLE_WALLETS_ARCHIVE_VISIBILITY:
      return !state
    default:
      return state
  }
}

const currentWalletRename = (state = '', action) => {
  switch (action.type) {
    case WALLET_LIST_ACTION.UPDATE_WALLET_RENAME_INPUT :
      return action.data
    case WALLET_LIST_ACTION.COMPLETE_RENAME_WALLET :
      return ''
    default :
      return state
  }
}

const currentWalletBeingRenamed = (state = null, action) => {
  switch (action.type) {
    case WALLET_LIST_ACTION.OPEN_RENAME_WALLET_MODAL:
      return action.data.key
    case WALLET_LIST_ACTION.UPDATE_CURRENT_RENAME_WALLET :
      return action.key
    case WALLET_LIST_ACTION.COMPLETE_RENAME_WALLET :
      return null
    default:
      return state
  }
}

const currentWalletBeingDeleted = (state = null, action) => {
  switch (action.type) {
    case WALLET_LIST_ACTION.CLOSE_DELETE_WALLET_MODAL:
      return null
    case WALLET_LIST_ACTION.START_DELETE_WALLET :
      return action.data.key
    case WALLET_ACTION.COMPLETE_DELETE_WALLET :
      return null
    default :
      return state
  }
}

const walletList = combineReducers({
  renameWalletVisible,
  deleteWalletVisible,
  archiveList,
  archiveVisible,
  currentWalletRename,
  currentWalletBeingRenamed,
  currentWalletBeingDeleted
})

export default walletList
