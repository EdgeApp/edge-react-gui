export const ADD_WALLET = 'ADD_WALLET'
export const RENAME_WALLET = 'RENAME_WALLET'
export const ACTIVATE_WALLET = 'ACTIVATE_WALLET'
export const ARCHIVE_WALLET = 'ARCHIVE_WALLET'
export const DELETE_WALLET = 'DELETE_WALLET'

import { makeCurrencyWallet } from 'airbitz-core-js'
import { makeShitcoinPlugin } from 'airbitz-currency-shitcoin'
import { makeWalletCallbacks } from './callbacks.js'
import {
  activateWalletId,
  archiveWalletId,
  deleteWalletId,
  selectWalletId
} from '../../UI/Wallets/action.js'

export const updateWallets = keyInfos => {
  return (dispatch, getState) => {
    // dispatch(updateWalletsStart())
    const state = getState()
    const walletIds = Object.keys(state.core.wallets.byId)

    const filteredSortedKeyInfos = keyInfos
      .filter(key => { return !key.deleted })
      .sort((a, b) => a.sortIndex - b.sortIndex)

    const activatedKeyInfos = getActivatedKeyInfos(filteredSortedKeyInfos)
    const archivedKeyInfos = getArchivedKeyInfos(filteredSortedKeyInfos)
    const deletedWalletIds = getDeletedWalletIds(walletIds, filteredSortedKeyInfos)

    activatedKeyInfos.forEach(keyInfo => {
      // startEngine if not already started (update core wallets)
      dispatch(activateWalletRequest(keyInfo))
    })

    archivedKeyInfos.forEach(keyInfo => {
      // stopEngine if not already stopped (update core wallets)
      // remove from core state
      dispatch(archiveWalletRequest(keyInfo))
    })

    deletedWalletIds.forEach(walletId => {
      // stopEngine if not already stopped (update core wallets)
      // remove from core state
      dispatch(deleteWalletRequest(walletId))
    })
  }
}

export const addWallet = wallet => {
  return {
    type: ADD_WALLET,
    data: { wallet }
  }
}

export const activateWalletRequest = keyInfo => {
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

    makeCurrencyWallet(keyInfo, opts)
    .then(wallet => {
// <<<<<<< HEAD
//       walletTemp = wallet
//       wallet.startEngine()
//       Promise.resolve()
//     })
//     .then((wallet) => {
//       console.log('walletTemp', walletTemp)
//       dispatch(addWallet(walletTemp))
//       dispatch(activateWalletId(walletTemp.id))
// =======
      // wallet.startEngine() should return the wallet
      wallet.startEngine()
      .then(() => {
        // update core state
        dispatch(addWallet(wallet))
        // update ui state
        dispatch(activateWalletId(wallet.id))
// >>>>>>> WIP

        // select a wallet id if none already selected
        const { selectedWalletId } = state.ui.wallets
        if (!selectedWalletId) {
          dispatch(selectWalletId(wallet.id))
        }
      })
    })
  }
}

export const archiveWalletRequest = walletId => {
  return (dispatch, getState) => {
    const wallet = getState().core.wallets.byId[walletId]
    // wallet.stopEngine() might be async, but if it throws an error, nothing can be done, so no need to wait
    wallet.stopEngine()
    // update core state
    dispatch(archiveWallet(walletId))
    // update ui state
    dispatch(archiveWalletId(walletId))
  }
}

export const archiveWallet = walletId => {
  return {
    type: ARCHIVE_WALLET,
    data: { walletId }
  }
}

export const deleteWalletRequest = walletId => {
  return (dispatch, getState) => {
    const wallet = getState().core.wallets.byId[walletId]
    // wallet.stopEngine() might be async, but if it throws an error, nothing can be done, so no need to wait
    wallet.stopEngine()
    // update core state
    dispatch(deleteWallet(walletId))
    // update ui state
    dispatch(deleteWalletId(walletId))
  }
}

export const deleteWallet = walletId => {
  return {
    type: DELETE_WALLET,
    data: { walletId }
  }
}

const getActivatedKeyInfos = keyInfos => {
  const activatedKeyInfos = keyInfos.filter(keyInfo => {
    return !keyInfo.archived
  })
  return activatedKeyInfos
}

const getArchivedKeyInfos = keyInfos => {
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

// create a function which, based on the current state of core wallets and the
// changed keyInfos, returns a changeset (pull this out into a helper library?)
// return (dispatch, getState) => {
//   const state = getState()
//   const abcWallets = state.wallets.byId
//   const uiWalletIds = Object.keys(state.ui.wallets.byId)
//   const activeWalletIds = Object.keys(state.ui.wallets.activeWalletIds)
//   const archivedWalletIds = Object.keys(state.ui.wallets.archivedWalletIds)
//   const allKeys = account.allKeys
//     .filter(key => { return !key.deleted })
//     .sort((a, b) => a.sortIndex - b.sortIndex)
//
//     // Pure function, get the data into our format:
//     const newActiveList = allKeys.filter(key =>  { return !key.archived })
//     const newArchivedList = allKeys.filter(key => { return key.archived })
//
//     // CORE DIFFING ALGORITHM
//     for (key of newActiveList) {
//       // never seen before, (unknown -> active)
//       // if (state.ui.wallets.byId[key] === undefined) {
//         // abcWallet = makeCurrencyWallet
//         // abcWallet.startEngine
//         // abcWallet -> state.wallets.byId
//         // abcWallet -> state.ui.wallets.byId
//         // add wallet.id to stateui.wallets.activeWalletIds
//       // }
//
//       // seen before, (archived -> active)
//       // if (!state.ui.wallets.byId[key].running) {
//         // wallet already exists in state.wallets.byId
//         // abcWallet.startEngine
//         // remove walletId from archivedWalletIds
//         // add walletId to activeWalletIds
//       // }
//     }
//
//     for (key of newArchivedList) {
//       // never seen before, (unknown -> archived)
//       if (!uiWalletIds.includes(key.id)) {
//         const abcWallet = makeCurrencyWallet
//         abcWallet -> state.wallets.byId
//         abcWallet -> state.ui.wallets.byId
//         add wallet.id to stateui.wallets.archivedWalletIds
//       }
//
//       // seen before, (active -> archived)
//       // if (state.ui.wallets.byId[key].running) {
//         // wallet already exists in state.wallets.byId
//         // abcWallet.stopEngine
//         // remove walletId from activeWalletIds
//         // add walletId to archivedWalletIds
//       // }
//     }
//
//     const walletIdsToDelete = Object.keys(state.wallets.byId)
//       .filter(id => { return !allKeys.find(info => info.id === id) })
//
//     walletIdsToDelete.forEach(id => {
//       dispatch(deleteWalletRequest(id))
//     })
// }

export const addWalletByKey = keyInfo => {
  return (dispatch, getState) => {
    const { id, archived } = keyInfo
    const state = getState()
    const { account, context } = state.core
    const { io } = context
    const { selectedWalletId } = state.ui.wallets
    const plugin = makeShitcoinPlugin({ io })
    const callbacks = makeWalletCallbacks(dispatch, getState, id)
    const opts = {
      account,
      plugin,
      callbacks,
      io
    }
    let walletTemp
    makeCurrencyWallet(keyInfo, opts)
    .then(wallet => {
      walletTemp = wallet
      // return wallet.startEngine()
      Promise.resolve()
    })
    .then((wallet) => {
      dispatch(addWallet(walletTemp))
      if (archived) {
        dispatch(archiveWalletId(walletTemp.id))
      } else {
        dispatch(activateWalletId(walletTemp.id))
      }

      if (!selectedWalletId) {
        dispatch(selectWalletId(walletTemp.id))
      }
    })
  }
}
