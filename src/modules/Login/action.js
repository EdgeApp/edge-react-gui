import * as ACCOUNT_ACTIONS from '../Core/Account/action.js'
import * as WALLET_API from '../Core/Wallets/api.js'
import * as WALLET_ACTIONS from '../Core/Wallets/action.js'
import * as UI_ACTIONS from '../UI/Wallets/action.js'

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
    const { account } = state.core
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

    filteredSortedKeyInfos.forEach(keyInfo => {
      processKeyInfo(keyInfo, dispatch, getState)
    })
  }
}

const processKeyInfo = (keyInfo, dispatch, getState) => {
  if (isPending(keyInfo, getState)) { return }

  if (shouldActivate(keyInfo, getState)) {
    activateWallet(keyInfo, dispatch, getState)
  }

  if (shouldArchive(keyInfo, getState)) {
    archiveWallet(keyInfo, dispatch, getState)
  }

  if (shouldReorder(keyInfo, getState)) {
    reorderWallet(keyInfo, getState)
  }
}

const activateWallet = (keyInfo, dispatch, getState) => {
  const state = getState()
  const { account } = state.core
  // Instantiate a new wallet object
  WALLET_API.makeCurrencyWalletRequest(keyInfo, dispatch, getState)
  .then(wallet => {
    // Turn the wallet on
    WALLET_API.activateWalletRequest(wallet)
  })
  .then(wallet => {
    // If changed were made during the wallet activation process,
    // start over
    const nextKeyInfo = account.allKeys.filter(keyInfo => {
      return keyInfo.id === wallet.id
    })
    if (hasChanged(wallet, nextKeyInfo)) {
      dispatch(WALLET_ACTIONS.removePendingStatus(wallet.Id))
      return processKeyInfo(nextKeyInfo, dispatch, getState)
    }

    // Add the wallet to Redux Core
    dispatch(WALLET_ACTIONS.addWallet(wallet))
    // Destructure the wallet and add it to Redux UI
    dispatch(UI_ACTIONS.activateWalletRequest(wallet))
  })
}

const archiveWallet = (keyInfo, dispatch, getState) => {
  const state = getState()
  const { account } = state.core
  const wallet = state.core.wallets.byId[keyInfo.id]

  // Turn the wallet off
  WALLET_API.archiveWalletRequest(wallet)
  .then(() => {
    // If changed were made during the wallet activation process,
    // start over
    const nextKeyInfo = account.allKeys.filter(keyInfo => {
      return keyInfo.id === wallet.id
    })
    if (hasChanged(wallet, nextKeyInfo)) {
      dispatch(WALLET_ACTIONS.removePendingStatus(wallet.Id))
      return processKeyInfo(nextKeyInfo, dispatch, getState)
    }

    // Destructure the wallet and add it to Redux UI
    dispatch(UI_ACTIONS.archiveWalletRequest(wallet))
  })
}

const deleteWallet = (keyInfo, dispatch) => {
  dispatch(deleteWallet(keyInfo.id))
}

const reorderWallet = (keyInfo, dispatch, getState) => {
  const state = getState()
  const wallet = state.core.wallets.byId[keyInfo.id]

  dispatch(UI_ACTIONS.addWallet(wallet))
}

const isPending = (keyInfo, getState) => {
  const state = getState()
  const pendingWalletIds = state.core.wallets
  const isPending = pendingWalletIds.includes(keyInfo.id)

  return isPending
}
const shouldActivate = (keyInfo, getState) => {
  const state = getState()
  const wallet = state.core.wallets.byId[keyInfo.id]
  const isNew = (!wallet)
  const isActivating = (!keyInfo.archived && wallet.archived)
  const shouldActivate = (isNew || isActivating)

  return shouldActivate
}
const shouldArchive = (keyInfo, getState) => {
  const state = getState()
  const wallet = state.core.wallets.byId[keyInfo.id]
  const isArchiving = (keyInfo.archived && !wallet.archived)

  return isArchiving
}
const shouldReorder = (keyInfo, getState) => {
  const state = getState()
  const wallet = state.core.wallets.byId[keyInfo.id]
  return (keyInfo.sortOrder !== wallet.sortOrder)
}
const hasChanged = (wallet, nextKeyInfo) => {
  return (
    wallet.archived === nextKeyInfo.archived &&
    wallet.sortOrder === nextKeyInfo.sortOrder
  )
}
