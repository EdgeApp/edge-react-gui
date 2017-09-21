export const TOGGLE_ARCHIVE_VISIBILITY = 'TOGGLE_ARCHIVE_VISIBILITY'

export const OPEN_DELETE_WALLET_MODAL = 'OPEN_DELETE_WALLET_MODAL'
export const CLOSE_DELETE_WALLET_MODAL = 'CLOSE_DELETE_WALLET_MODAL'

export const OPEN_RENAME_WALLET_MODAL = 'OPEN_RENAME_WALLET_MODAL'
export const CLOSE_RENAME_WALLET_MODAL = 'CLOSE_RENAME_WALLET_MODAL'
export const UPDATE_RENAME_WALLET_INPUT = 'UPDATE_RENAME_WALLET_INPUT'

export const UPDATE_ACTIVE_WALLETS_ORDER_START = 'UPDATE_ACTIVE_WALLETS_ORDER_START'
export const UPDATE_ACTIVE_WALLETS_ORDER_SUCCESS = 'UPDATE_ACTIVE_WALLETS_ORDER_SUCCESS'

export const UPDATE_ARCHIVED_WALLETS_ORDER_START = 'UPDATE_ARCHIVED_WALLETS_ORDER_START'
export const UPDATE_ARCHIVED_WALLETS_ORDER_SUCCESS = 'UPDATE_ARCHIVED_WALLETS_ORDER_SUCCESS'

export const ARCHIVE_WALLET_START = 'ARCHIVE_WALLET_START'
export const ARCHIVE_WALLET_SUCCESS = 'ARCHIVE_WALLET_SUCCESS'

export const ACTIVATE_WALLET_START = 'ACTIVATE_WALLET_START'
export const ACTIVATE_WALLET_SUCCESS = 'ACTIVATE_WALLET_SUCCESS'

export const RENAME_WALLET_START = 'RENAME_WALLET_START'
export const RENAME_WALLET_SUCCESS = 'RENAME_WALLET_SUCCESS'

export const DELETE_WALLET_START = 'DELETE_WALLET_START'
export const DELETE_WALLET_SUCCESS = 'DELETE_WALLET_SUCCESS'

export const ADD_TOKEN = 'ADD_TOKEN'

import * as ACCOUNT_API from '../../../Core/Account/api.js'
import * as WALLET_API from '../../../Core/Wallets/api.js'
import * as UI_ACTIONS from '../../Wallets/action.js'

import * as CORE_SELECTORS from '../../../Core/selectors.js'

export const walletRowOption = (walletId, option) => {
  switch (option) {
  case 'restore':
  case 'activate':
    return (dispatch, getState) => {
      const state = getState()
      const account = CORE_SELECTORS.getAccount(state)

      dispatch(activateWalletStart(walletId))

      ACCOUNT_API.activateWalletRequest(account, walletId)
        .then(() => {
          dispatch(activateWalletSuccess(walletId))
        })
        .catch((e) => console.log(e))
    }

  case 'archive':
    return (dispatch, getState) => {
      const state = getState()
      const account = CORE_SELECTORS.getAccount(state)

      dispatch(archiveWalletStart(walletId))

      ACCOUNT_API.archiveWalletRequest(account, walletId)
        .then(() => {
          dispatch(archiveWalletSuccess(walletId))
        })
        .catch((e) => console.log(e))
    }

  case 'delete':
    return (dispatch) => {
      dispatch(openDeleteWalletModal(walletId))
    }

  case 'rename':
    return (dispatch) => {
      dispatch(openRenameWalletModal(walletId))
    }

  case 'addToken':
    return (dispatch) => {
      dispatch(addToken(walletId))
    }
  }
}

export const renameWallet = (walletId, walletName) => (dispatch, getState) => {
  const state = getState()
  const wallet = CORE_SELECTORS.getWallet(state, walletId)

  dispatch(renameWalletStart(walletId))

  WALLET_API.renameWalletRequest(wallet, walletName)
    .then(() => {
      dispatch(renameWalletSuccess(walletId))
      dispatch(UI_ACTIONS.refreshWallet(walletId))
    })
    .catch((e) => console.log(e))
}

export const deleteWallet = (walletId) => (dispatch, getState) => {
  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)

  dispatch(deleteWalletStart(walletId))

  ACCOUNT_API.deleteWalletRequest(account, walletId)
    .then(() => {
      dispatch(deleteWalletSuccess(walletId))
      dispatch(closeDeleteWalletModal())
    })
    .catch((e) => console.log(e))
}

export const updateActiveWalletsOrder = (activeWalletIds) => (dispatch, getState) => {
  const state = getState()
  const {account} = state.core
  dispatch(updateActiveWalletsOrderStart(activeWalletIds))
  ACCOUNT_API.updateActiveWalletsOrderRequest(account, activeWalletIds)
    .then(() => {
      dispatch(updateActiveWalletsOrderSuccess(activeWalletIds))
    })
    .catch((e) => console.log(e))
}

export const updateIndividualWalletSortIndex = (walletId, sortIndex) => (dispatch, getState) => {
  const state = getState()
  const wallet = CORE_SELECTORS.getWallet(state, walletId)
  wallet.sortIndex = sortIndex
  return dispatch(UI_ACTIONS.upsertWallet(wallet))
}

export const updateArchivedWalletsOrder = (archivedWalletIds) => (dispatch, getState) => {
  const state = getState()
  const {account} = state.core

  dispatch(updateArchivedWalletsOrderStart(archivedWalletIds))

  ACCOUNT_API.updateArchivedWalletsOrderRequest(account, archivedWalletIds)
    .then((response) => {
      dispatch(updateArchivedWalletsOrderSuccess(response))
    })
    .catch((e) => console.log(e))
}

const updateActiveWalletsOrderStart = (activeWalletIds) => ({
  type: UPDATE_ACTIVE_WALLETS_ORDER_START,
  data: {activeWalletIds}
})

const updateActiveWalletsOrderSuccess = (activeWalletIds) => ({
  type: UPDATE_ACTIVE_WALLETS_ORDER_SUCCESS,
  data: {activeWalletIds}
})

const updateArchivedWalletsOrderStart = (archivedWalletIds) => ({
  type: UPDATE_ARCHIVED_WALLETS_ORDER_START,
  data: {archivedWalletIds}
})

const updateArchivedWalletsOrderSuccess = (archivedWalletIds) => ({
  type: UPDATE_ARCHIVED_WALLETS_ORDER_SUCCESS,
  data: {archivedWalletIds}
})

const activateWalletStart = (walletId) => ({
  type: ACTIVATE_WALLET_START,
  data: {walletId}
})

const activateWalletSuccess = (walletId) => ({
  type: ACTIVATE_WALLET_SUCCESS,
  data: {walletId}
})

const archiveWalletStart = (walletId) => ({
  type: ARCHIVE_WALLET_START,
  data: {walletId}
})

const archiveWalletSuccess = (walletId) => ({
  type: ARCHIVE_WALLET_SUCCESS,
  data: {walletId}
})

export const addToken = (walletId) => ({
  type: ADD_TOKEN,
  data: {walletId}
})

export const renameWalletStart = (walletId) => ({
  type: RENAME_WALLET_START,
  data: {walletId}
})

export const renameWalletSuccess = (walletId) => ({
  type: RENAME_WALLET_SUCCESS,
  data: {walletId}
})

export const deleteWalletStart = (walletId) => ({
  type: DELETE_WALLET_START,
  data: {walletId}
})

export const deleteWalletSuccess = (walletId) => ({
  type: DELETE_WALLET_SUCCESS,
  data: {walletId}
})

export const openDeleteWalletModal = (walletId) => ({
  type: OPEN_DELETE_WALLET_MODAL,
  data: {walletId}
})

export const closeDeleteWalletModal = () => ({
  type: CLOSE_DELETE_WALLET_MODAL
})

export const openRenameWalletModal = (walletId) => (dispatch, getState) => {
  const state = getState()
  const walletName = CORE_SELECTORS.getWallet(state, walletId).name

  dispatch({
    type: OPEN_RENAME_WALLET_MODAL,
    data: {walletId, walletName}
  })
}

export const closeRenameWalletModal = () => ({
  type: CLOSE_RENAME_WALLET_MODAL
})

export const updateRenameWalletInput = (renameWalletInput) => ({
  type: UPDATE_RENAME_WALLET_INPUT,
  data: {renameWalletInput}
})

export function toggleArchiveVisibility () {
  return {
    type: TOGGLE_ARCHIVE_VISIBILITY
  }
}
