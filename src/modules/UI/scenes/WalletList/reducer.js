import * as ACTION from './action'
import {combineReducers} from 'redux'

const renameWalletModalVisible = (state = false, action) => {
  const {type} = action
  switch (type) {
  case ACTION.OPEN_RENAME_WALLET_MODAL:
    return true
  case ACTION.CLOSE_RENAME_WALLET_MODAL:
    return false
  default:
    return state
  }
}

const deleteWalletModalVisible = (state = false, action) => {
  const {type} = action
  switch (type) {
  case ACTION.OPEN_DELETE_WALLET_MODAL:
    return true
  case ACTION.CLOSE_DELETE_WALLET_MODAL:
    return false
  default:
    return state
  }
}

const walletArchivesVisible = (state = false, action) => {
  switch (action.type) {
  case ACTION.OPEN_WALLET_ARCHIVES:
    return true
  case ACTION.CLOSE_WALLET_ARCHIVES:
    return false
  default:
    return state
  }
}

const walletId = (state = '', action) => {
  switch (action.type) {
  case ACTION.OPEN_DELETE_WALLET_MODAL:
  case ACTION.OPEN_RENAME_WALLET_MODAL:
    if (action.data) {
      return action.data.walletId
    }
    return state
  case ACTION.CLOSE_DELETE_WALLET_MODAL:
  case ACTION.CLOSE_RENAME_WALLET_MODAL:
    return ''
  default:
    return state
  }
}

const walletName = (state = '', action) => {
  switch (action.type) {
  case ACTION.OPEN_RENAME_WALLET_MODAL:
    if (action.data && action.data.walletName) {
      return walletName
    }
    return 'Wallet Name'
    // case ACTION.CLOSE_RENAME_WALLET_MODAL:
    //   return ''
  default:
    return state
  }
}

const renameWalletInput = (state = '', action) => {
  switch (action.type) {
  case ACTION.UPDATE_RENAME_WALLET_INPUT:
    if (action.data && action.data.renameWalletInput) {
      return renameWalletInput
    }
    return ''
  case ACTION.CLOSE_RENAME_WALLET_MODAL:
  case ACTION.RENAME_WALLET:
    return ''
  default:
    return state
  }
}

const walletList = combineReducers({
  renameWalletModalVisible,
  deleteWalletModalVisible,
  walletArchivesVisible,
  renameWalletInput,
  walletId,
  walletName
})

export default walletList
