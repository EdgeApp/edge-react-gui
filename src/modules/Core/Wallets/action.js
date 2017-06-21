export const ADD_WALLET = 'ADD_WALLET'
export const REMOVE_WALLET = 'REMOVE_WALLET'
export const WALLET_UPDATE_START = 'WALLET_UPDATE_START'
export const WALLET_UPDATE_COMPLETE = 'WALLET_UPDATE_COMPLETE'

import * as WALLET_API from '../../Core/Wallets/api.js'
import * as UI_ACTIONS from '../../UI/Wallets/action.js'

const activateWallet = (dispatch, getState, state, keyInfo, walletId) => {
  // console.log('keyInfo', keyInfo)
  // Set the wallet's pending status to true to prevent additional updates
  // during the activation period
  dispatch(walletUpdateStart(walletId))

  const { account, context } = state.core
  const { io } = context
  const plugin = makeShitcoinPlugin({ io })
  const callbacks = makeWalletCallbacks(dispatch, getState, walletId)
  const opts = {
    account,
    plugin,
    callbacks,
    io
  }

  return makeCurrencyWallet(keyInfo, opts)
  .then(wallet => {
    WALLET_API.activateWalletRequest(wallet)
    .then(() => {
      // Update Redux Core first when activating a wallet.
      // console.log('keyInfo', keyInfo)
      dispatch(addWallet(wallet, keyInfo))

      // Update Redux UI only after Redux Core has been updated.
      dispatch(UI_ACTIONS.activateWalletId(walletId))

      // Select default wallet. This selects the first wallet passed in
      // when the application loads. This depends on the keys being passed
      // into the cycle in the sortIndex order.
      dispatch(UI_ACTIONS.selectWalletIdRequest(walletId))

      // Set the wallet's pending status to false to allow future updates
      dispatch(walletUpdateComplete(walletId))

      // Grab the current wallets most recent keyInfo
      const targetKeyInfo = account.allKeys.find(keyInfo => {
        return keyInfo.id === walletId
      })
      // If the wallet was deleted during the activation period,
      // then delete it
      if (targetKeyInfo.deleted) {
        return dispatch(deleteWalletRequest(walletId))
      }
      // If the wallet was archived during the activation period,
      // then archive it.
      // This might also trigger if a new archived wallet is detected.
      if (targetKeyInfo.archived) {
        return dispatch(archiveWalletRequest(targetKeyInfo))
      }
    })
  })
}

const archiveWallet = (dispatch, state, walletId) => {
  // Set the wallest's pending status to true to prevent additional updates
  // during the activation period
  dispatch(walletUpdateStart(walletId))

  // Update Redux UI first when archiving a wallet.
  dispatch(UI_ACTIONS.archiveWalletId(walletId))

  const wallet = state.core.wallets.byId[walletId]
  WALLET_API.archiveWalletRequest(wallet)
  .then(() => {
    // Update Redux Core only after Redux UI has been updated.
    dispatch(removeWallet(walletId))

    // Set the wallet's pending status to false to allow future updates
    dispatch(walletUpdateComplete(walletId))
  })
  .catch(e => { console.log(e) })
}

const deleteActiveWallet = (dispatch, state, walletId) => {
  // Set the wallest's pending status to true to prevent additional updates
  // during the activation period
  dispatch(walletUpdateStart(walletId))

  // Update Redux UI first when deleting a wallet.
  dispatch(UI_ACTIONS.deleteWalletId(walletId))

  const wallet = state.core.wallets.byId[walletId]
  WALLET_API.deleteWalletRequest(wallet)
  .then(() => {
    // Update Redux Core only after Redux UI has been updated.
    dispatch(removeWallet(walletId))

    // Set the wallet's pending status to false to allow future updates
    dispatch(walletUpdateComplete(walletId))
  })
  .catch(e => { console.log(e) })
}

const deleteArchivedWallet = (dispatch, walletId) => {
  // Update Redux UI first when deleting a wallet.
  dispatch(UI_ACTIONS.deleteWalletId(walletId))
}

const addWallet = (wallet, keyInfo) => {
  return {
    type: ADD_WALLET,
    data: { wallet, keyInfo }
  }
}

const removeWallet = walletId => {
  return {
    type: REMOVE_WALLET,
    data: { walletId }
  }
}

const walletUpdateStart = walletId => {
  return {
    type: WALLET_UPDATE_START,
    data: { walletId }
  }
}

const walletUpdateComplete = walletId => {
  return {
    type: WALLET_UPDATE_COMPLETE,
    data: { walletId }
  }
}
