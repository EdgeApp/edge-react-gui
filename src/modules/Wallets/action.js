export const ADD_WALLET = 'ADD_WALLET'
export const CREATE_WALLET = 'CREATE_WALLET'
export const RENAME_WALLET = 'RENAME_WALLET'
export const ARCHIVE_WALLET = 'ARCHIVE_WALLET'
export const DE_ARCHIVE_WALLET = 'DE_ARCHIVE_WALLET'

import {
  createWalletStart,
  createWalletSuccess,
  createWalletFailure
} from '../UI/scenes/AddWallet/action.js'

export const addWallet = (wallet) => {
  return {
    type: ADD_WALLET,
    data: { wallet }
  }
}

export const createWallet = (wallet) => {
  return (dispatch, getState) => {
    dispatch(createWalletStart())

    // send command to account to add wallet
    getState().account.createWallet(wallet.type, wallet.keys)
    .then(
      dispatch(createWalletSuccess),
      dispatch(createWalletFailure),
    )
  }
}

export const archiveWallet = (walletId) => {
  return (dispatch, getState) => {
    dispatch(archiveWallet(walletId))

    // send command to account to archive wallet
    getState().account.archiveWallet(walletId)
    .then(
      dispatch(archiveWalletSuccess),
      dispatch(archiveWalletFailure),
    )
  }
}

export const deArchiveWallet = (walletId) => {
  return (dispatch, getState) => {
    dispatch(deArchiveWallet(walletId))

    // send command to account to de-archive wallet
    getState().account.deArchiveWallet(walletId)
    .then(
      dispatch(deArchiveWalletSuccess),
      dispatch(deArchiveWalletFailure),
    )
  }
}
