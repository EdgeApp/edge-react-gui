// this goes into UI/Wallets
// export const ARCHIVE_WALLET         = 'ARCHIVE_WALLET'
// export const ARCHIVE_WALLET_SUCCESS = 'ARCHIVE_WALLET_SUCCESS'
// export const ARCHIVE_WALLET_ERROR   = 'ARCHIVE_WALLET_ERROR'
//
// export const DE_ARCHIVE_WALLET         = 'DE_ARCHIVE_WALLET'
// export const DE_ARCHIVE_WALLET_SUCCESS = 'DE_ARCHIVE_WALLET_SUCCESS'
// export const DE_ARCHIVE_WALLET_ERROR   = 'DE_ARCHIVE_WALLET_ERROR'

import {
  createWalletStart,
  createWalletSuccess,
  createWalletFailure
} from '../AddWallet/action.js'

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
