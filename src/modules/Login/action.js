import * as ACCOUNT_ACTIONS from '../Core/Account/action.js'
import * as WALLET_API from '../Core/Wallets/api.js'
import * as WALLET_ACTIONS from '../Core/Wallets/action.js'
import * as UI_ACTIONS from '../UI/Wallets/action.js'

import { compare } from '../utils.js'

export const initializeAccount = account => {
  return dispatch => {
    dispatch(ACCOUNT_ACTIONS.addAccount(account))
    dispatch(updateWallets())
  }
}

export const updateWallets = () => {
  return (dispatch, getState) => {
    console.log('updating wallets')
    // dispatch(updateWalletsStart())
    const state = getState()
    const { account, context } = state.core
    const { io } = context
    const supportedTypes = [
      'wallet:shitcoin',
      'wallet:bitcoin',
      'wallet:ethereum'
    ]

    const filteredSortedKeyInfos = account.allKeys
      .filter(keyInfo => {
        return (!keyInfo.deleted && supportedTypes.includes(keyInfo.type))
      })
      .sort((a, b) => a.sortIndex - b.sortIndex)

    filteredSortedKeyInfos.forEach(nextKeyInfo => {
      const prevKeyInfo = state.ui.wallets.keyInfos.byId[nextKeyInfo.id]
      processKeyInfo(prevKeyInfo, nextKeyInfo, dispatch, state, io, account)
    })
  }
}

const processKeyInfo = (prevKeyInfo, nextKeyInfo, dispatch, state, io, account) => {
  const hasChanged = !compare(prevKeyInfo, nextKeyInfo)
  const isNew = (prevKeyInfo === undefined)
  const needsActivating = (prevKeyInfo && prevKeyInfo.archived && !nextKeyInfo.archived)
  const needsArchiving = (prevKeyInfo && !prevKeyInfo.archived && nextKeyInfo.archived)
  const needsReordering = (prevKeyInfo && prevKeyInfo.archived && !nextKeyInfo.archived)

  if (!hasChanged) { return }

  if (isNew || needsActivating) {
    // Instantiate a new wallet object
    WALLET_API.makeCurrencyWalletRequest(nextKeyInfo, dispatch, io, account)
    .then(wallet => {
      // Turn the wallet on
      WALLET_API.activateWalletRequest(wallet)
    })
    .then(wallet => {
      // Add the wallet to Redux Core
      dispatch(WALLET_ACTIONS.addWallet(wallet))
      // Destructure the wallet and add it to Redux UI
      dispatch(UI_ACTIONS.addWallet(wallet))
      // Update the keyInfo stored in Redux UI to reflect activation
      dispatch(UI_ACTIONS.activateKeyInfo(prevKeyInfo))
    })
  }

  if (needsArchiving) {
    const wallet = state.core.wallets.byId[nextKeyInfo.id]
    // Turn the wallet off
    WALLET_API.archiveWalletRequest(wallet)
    .then(() => {
      // Remove the wallet from Redux Core
      // Eventually this step will be removed, and archived wallets will remain
      // in Redux Core.
      dispatch(WALLET_ACTIONS.removeWallet(wallet))
      // Destructure the wallet and add it to Redux UI
      dispatch(UI_ACTIONS.addWallet(wallet))
      // Update the keyInfo stored in Redux UI to reflect archiving
      dispatch(UI_ACTIONS.archiveKeyInfo(prevKeyInfo))
    })
  }

  if (needsReordering) {
    const wallet = state.core.wallets.byId[nextKeyInfo.id]
    // Destructure the wallet and add it to Redux UI
    dispatch(UI_ACTIONS.addWallet(wallet))
    // Update the keyInfo stored in Redux UI to reflect reordering
    dispatch(UI_ACTIONS.reorderKeyInfo(prevKeyInfo))
  }

  const currentAccountKeyInfo = account.allKeys.find(keyInfo => {
    return keyInfo.id === keyInfo.id
  })

  const currentUIKeyInfo = state.wallets.keyInfos.byId[nextKeyInfo.id]

  processKeyInfo(currentUIKeyInfo, currentAccountKeyInfo, dispatch, state, io, account)
}
