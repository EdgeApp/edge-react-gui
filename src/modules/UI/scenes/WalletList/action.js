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

export const UPDATE_ACTIVE_WALLETS_ORDER_START = 'UPDATE_ACTIVE_WALLETS_ORDER_START'
export const UPDATE_ACTIVE_WALLETS_ORDER_SUCCESS = 'UPDATE_ACTIVE_WALLETS_ORDER_SUCCESS'

export const UPDATE_ARCHIVED_WALLETS_ORDER_START = 'UPDATE_ARCHIVED_WALLETS_ORDER_START'
export const UPDATE_ARCHIVED_WALLETS_ORDER_SUCCESS = 'UPDATE_ARCHIVED_WALLETS_ORDER_SUCCESS'

export const ADD_TOKEN = 'ADD_TOKEN'

import * as ACCOUNT_API from '../../../Core/Account/api.js'
import * as WALLET_API from '../../../Core/Wallets/api.js'
import * as LOGIN from '../../../Login/action.js'

export const executeWalletRowOption = (walletId, option) => {
  switch (option) {
    case 'Restore':
    case 'Activate':
      return (dispatch, getState) => {
        const state = getState()
        const account = state.core.account
        ACCOUNT_API.activateWalletRequest(account, walletId)
        .then(dispatch(LOGIN.updateWallets(account)))
      }

    case 'Archive':
      return (dispatch, getState) => {
        const state = getState()
        const account = state.core.account
        ACCOUNT_API.archiveWalletRequest(account, walletId)
        .then(dispatch(LOGIN.updateWallets(account)))
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

export const renameWallet = (walletId, walletName) => {
  return (dispatch, getState) => {
    const state = getState()
    const account = state.core.account
    const wallet = state.core.wallets.byId[walletId]
    WALLET_API.renameWalletRequest(wallet, walletName)
    .then(dispatch(LOGIN.updateWallets(account)))
  }
}

export const deleteWallet = walletId => {
  return (dispatch, getState) => {
    const state = getState()
    const account = state.core.account
    ACCOUNT_API.deleteWalletRequest(account, walletId)
    .then(dispatch(LOGIN.updateWallets(account)))
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

export function toggleArchiveVisibility () {
  return {
    type: TOGGLE_WALLETS_ARCHIVE_VISIBILITY
  }
}

export const updateActiveWalletsOrder = activeWalletIds => {
  console.log('updating active wallet ids', activeWalletIds)
  return (dispatch, getState) => {
    const state = getState()
    const { account } = state.core

    dispatch(updateActiveWalletsOrderStart(activeWalletIds))

    ACCOUNT_API.updateActiveWalletsOrderRequest(account, activeWalletIds)
    .then(response => {
      dispatch(dispatch(updateActiveWalletsOrderSuccess(activeWalletIds)))
      dispatch(LOGIN.updateWallets(account))
    })
    .catch(e => console.log(e))
  }
}

export const updateArchivedWalletsOrder = archivedWalletIds => {
  return (dispatch, getState) => {
    const state = getState()
    const { account } = state.core

    dispatch(updateArchivedWalletsOrderStart(archivedWalletIds))

    ACCOUNT_API.updateArchivedWalletsOrderRequest(account, archivedWalletIds)
    .then(response => {
      dispatch(updateArchivedWalletsOrderSuccess(response))
      dispatch(LOGIN.updateWallets(account))
    })
    .catch(e => console.log(e))
  }
}

const updateActiveWalletsOrderStart = activeWalletIds => {
  return {
    type: UPDATE_ACTIVE_WALLETS_ORDER_START,
    data: { activeWalletIds }
  }
}

const updateActiveWalletsOrderSuccess = activeWalletIds => {
  return {
    type: UPDATE_ACTIVE_WALLETS_ORDER_SUCCESS,
    data: { activeWalletIds }
  }
}

const updateArchivedWalletsOrderStart = archivedWalletIds => {
  return {
    type: UPDATE_ARCHIVED_WALLETS_ORDER_START,
    data: { archivedWalletIds }
  }
}

const updateArchivedWalletsOrderSuccess = archivedWalletIds => {
  return {
    type: UPDATE_ARCHIVED_WALLETS_ORDER_SUCCESS,
    data: { archivedWalletIds }
  }
}
