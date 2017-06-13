import { addAccount } from '../Core/Account/action.js'
import { addWallet, removeWallet } from '../Core/Wallets/action.js'
import { activateWalletIdRequest, archiveWalletIdRequest, deleteWalletIdRequest } from '../UI/Wallets/action.js'

import * as WALLET_API from '../Core/Wallets/api.js'

import { makeCurrencyWallet } from 'airbitz-core-js'
import { makeShitcoinPlugin } from 'airbitz-currency-shitcoin'
import { makeWalletCallbacks } from '../Core/Wallets/callbacks.js'

export const initializeAccount = account => {
  return dispatch => {
    dispatch(addAccount(account))
    const supportedTypes = [
      'wallet:shitcoin',
      'wallet:bitcoin'
    ]
    let allKeys = account.allKeys

    const keyInfos = allKeys.filter(keyInfo => {
      return supportedTypes.includes(keyInfo.type)
    })
    dispatch(updateWallets(keyInfos))
  }
}

const updateWallets = keyInfos => {
  return (dispatch, getState) => {
    // dispatch(updateWalletsStart())
    const state = getState()
    const walletIds = Object.keys(state.core.wallets.byId)

    const filteredSortedKeyInfos = keyInfos
      .filter(key => { return !key.deleted })
      .sort((a, b) => a.sortIndex - b.sortIndex)

    const activatedKeyInfos = getActivatedKeyInfos(filteredSortedKeyInfos)
    const archivedWalletIds = getArchivedWalletIds(filteredSortedKeyInfos)
    const deletedWalletIds = getDeletedWalletIds(walletIds, filteredSortedKeyInfos)

    activatedKeyInfos.forEach(keyInfo => {
      // startEngine if not already started (update core wallets)
      dispatch(activateWallet(keyInfo))
    })

    archivedWalletIds.forEach(walletId => {
      // stopEngine if not already stopped (update core wallets)
      // remove from core state
      dispatch(archiveWallet(walletId))
    })

    deletedWalletIds.forEach(walletId => {
      // stopEngine if not already stopped (update core wallets)
      // remove from core state
      dispatch(deleteWallet(walletId))
    })
  }
}

const activateWallet = keyInfo => {
  return (dispatch, getState) => {
    const { id } = keyInfo
    const state = getState()
    const wallet = state.core.wallets.byId[id]
    // if wallet is already in state.core.wallets, assume it's already active
    if (wallet) { return }

    const { account, context } = state.core
    const { io } = context
    const plugin = makeShitcoinPlugin({ io })
    const callbacks = makeWalletCallbacks(dispatch, getState, id)
    const opts = {
      account,
      plugin,
      callbacks,
      io
    }

    return makeCurrencyWallet(keyInfo, opts)
    .then(wallet => {
      // wallet.startEngine() should return the wallet
      WALLET_API.activateWalletRequest(wallet)
      .then(() => {
        // update core state
        dispatch(addWallet(wallet))
        // update ui state
        dispatch(activateWalletIdRequest(wallet.id))
      })
    })
  }
}

const archiveWallet = walletId => {
  return dispatch => {
    // wallet.stopEngine() might be async, but if it throws an error, nothing can be done, so no need to wait
    WALLET_API.archiveWalletRequest(walletId)
    // update core state
    dispatch(removeWallet(walletId))
    // update ui state
    dispatch(archiveWalletIdRequest(walletId))
  }
}

const deleteWallet = walletId => {
  return dispatch => {
    // wallet.stopEngine() might be async, but if it throws an error, nothing can be done, so no need to wait
    WALLET_API.deleteWalletRequest(walletId)
    // update core state
    dispatch(removeWallet(walletId))
    // update ui state
    dispatch(deleteWalletIdRequest(walletId))
  }
}

const getActivatedKeyInfos = keyInfos => {
  const activatedKeyInfos = keyInfos.filter(keyInfo => {
    return !keyInfo.archived
  })
  return activatedKeyInfos
}

const getArchivedWalletIds = keyInfos => {
  const archivedKeyInfos = keyInfos.filter(keyInfo => {
    return keyInfo.archived
  })
  return archivedKeyInfos
}

const getDeletedWalletIds = (walletIds, keyInfos) => {
  const deletedWalletIds = walletIds
    .filter(walletId => {
      return !keyInfos.find(info => info.id === walletId)
    })

  return deletedWalletIds
}
