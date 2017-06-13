export const UPDATE_WALLET_LIST_ORDER = 'UPDATE_WALLET_LIST_ORDER'
export const UPDATE_ARCHIVE_LIST_ORDER = 'UPDATE_ARCHIVE_LIST_ORDER'
export const TOGGLE_ARCHIVE_VISIBILITY = 'TOGGLE_ARCHIVE_VISIBILITY'
export const TOGGLE_WALLETS_ARCHIVE_VISIBILITY = 'TOGGLE_WALLETS_ARCHIVE_VISIBILITY'
export const TOGGLE_RENAME_WALLET_MODAL = 'TOGGLE_RENAME_WALLET_MODAL'

export const START_DELETE_WALLET = 'START_DELETE WALLET'
export const UPDATE_WALLET_ORDER = 'UPDATE_WALLET_ORDER'
export const TOGGLE_ARCHIVE_WALLET = 'TOGGLE_ARCHIVE_WALLET'
export const COMPLETE_RENAME_WALLET = 'COMPLETE_RENAME_WALLET'
export const UPDATE_CURRENT_RENAME_WALLET = 'UPDATE_CURRENT_RENAME_WALLET'

export const OPEN_DELETE_WALLET_MODAL = 'OPEN_DELETE_WALLET_MODAL'
export const CLOSE_DELETE_WALLET_MODAL = 'CLOSE_DELETE_WALLET_MODAL'
export const OPEN_RENAME_WALLET_MODAL = 'OPEN_RENAME_WALLET_MODAL'
export const CLOSE_RENAME_WALLET_MODAL = 'CLOSE_RENAME_WALLET_MODAL'
export const UPDATE_RENAME_WALLET_INPUT = 'UPDATE_RENAME_WALLET_INPUT'

export const ADD_TOKEN = 'ADD_TOKEN'

import * as ACCOUNT_API from '../../../Core/Account/api.js'
import * as WALLET_API from '../../../Core/Wallets/api.js'

export const executeWalletRowOption = (walletId, option) => {
  switch (option) {
    case 'Restore':
    case 'Activate':
      return dispatch => {
        dispatch(ACCOUNT_API.activateWalletRequest(walletId))
      }

    case 'Archive':
      return dispatch => {
        dispatch(ACCOUNT_API.archiveWalletRequest(walletId))
      }

    case 'Delete':
      return dispatch => {
        dispatch(openDeleteWalletModal(walletId))
      }

    case 'Rename':
      return dispatch => {
        dispatch(openRenameWalletModal(walletId))
      }

    case 'Add Token':
      return dispatch => {
        dispatch(addToken(walletId))
      }
  }
}

export const addToken = walletId => {
  return {
    type: ADD_TOKEN,
    data: { walletId }
  }
}

export const openDeleteWalletModal = walletId => {
  return {
    type: OPEN_DELETE_WALLET_MODAL,
    data: { walletId }
  }
}

export const closeDeleteWalletModal = () => {
  return {
    type: CLOSE_DELETE_WALLET_MODAL
  }
}

export const openRenameWalletModal = walletId => {
  return (dispatch, getState) => {
    const state = getState()
    const walletName = state.core.wallets.byId[walletId].name

    dispatch({
      type: OPEN_RENAME_WALLET_MODAL,
      data: { walletId, walletName }
    })
  }
}

export const closeRenameWalletModal = () => {
  return {
    type: CLOSE_RENAME_WALLET_MODAL
  }
}

export const updateRenameWalletInput = renameWalletInput => {
  return {
    type: UPDATE_RENAME_WALLET_INPUT,
    data: { renameWalletInput }
  }
}

export const renameWallet = (walletId, walletName) => {
  return (dispatch, getState) => {
    dispatch(WALLET_API.renameWalletRequest(walletId, walletName))
  }
}

export const deleteWallet = walletId => {
  return dispatch => {
    dispatch(ACCOUNT_API.deleteWalletRequest(walletId))
  }
}

export function updateWalletOrder (walletOrder) {
  return {
    type: UPDATE_WALLET_ORDER,
    data: walletOrder
  }
}

export function updateWalletListOrder (order, list, listArray) {
  const walletOrder = order
  const walletList = list
  const walletOrderWithIds = []
  const newWalletList = {}
  var iterator = 0

  for (let prop of order) {
    newWalletList[listArray[prop].id] = listArray[prop] // .push(list[parseInt(prop)].id)
    newWalletList[listArray[prop].id].order = prop
    // newWalletList[prop].order = iterator
    iterator++
  }
  let data = newWalletList
  return {
    type: UPDATE_WALLET_LIST_ORDER,
    data
  }
}

export function updateArchiveListOrder (data) {
  return {
    type: UPDATE_ARCHIVE_LIST_ORDER,
    data
  }
}

export function toggleArchiveVisibility () {
  return {
    type: TOGGLE_WALLETS_ARCHIVE_VISIBILITY
  }
}
