import * as ACTION from './WalletList.action'

/*export const walletList = (state = [], action) => {
  switch (action.type) {
    case ACTION.UPDATE_WALLET_LIST :
      return action.data
    case ACTION.UPDATE_WALLET_LIST_ORDER :
      return action.data
    default:
      return state
  }
}*/

export const renameWalletVisible = (state = false, action) => {
  switch (action.type) {
    case ACTION.START_RENAME_WALLET : 
      return true
    default : 
      return state
  }
}

export const deleteWalletVisible = (state = false, action) => {
  switch (action.type) {
    case ACTION.START_DELETE_WALLET : 
      return true
    default : 
      return state
  }
}

export const archiveList = (state = [], action) => {
  switch (action.type) {
    case ACTION.UPDATE_ARCHIVE_LIST_ORDER: 
      return action.data
    default: 
      return state
  }
}

export const walletsVisible = (state = true, action) => {
  switch (action.type) {
    case ACTION.TOGGLE_WALLETS_VISIBILITY: 
      return action.walletsVisibility
    case ACTION.UPDATE_WALLETS_ARCHIVE_VISIBILITY:
      return action.walletsVisibility
    default:
      return state
  }
}

export const archiveVisible = (state = false, action) => {
  switch (action.type) {
    case ACTION.TOGGLE_ARCHIVE_VISIBILITY: 
      return action.archiveVisibility
    case ACTION.UPDATE_WALLETS_ARCHIVE_VISIBILITY:
      return action.archiveVisibility
    default:
      return state
  }
}