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
        return (supportedTypes.includes(keyInfo.type))
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
  } else if (shouldArchive(keyInfo, getState)) {
    archiveWallet(keyInfo, dispatch, getState)
  } else if (shouldReorder(keyInfo, getState)) {
    reorderWallet(keyInfo, getState)
  } else if (shouldDelete(keyInfo, getState)) {
    deleteWallet(keyInfo, getState)
  }
}

const activateWallet = (keyInfo, dispatch, getState) => {
  dispatch(WALLET_ACTIONS.updateWalletStart(keyInfo.id))
  const state = getState()
  const { account } = state.core
  // Instantiate a new wallet object
  WALLET_API.makeCurrencyWalletRequest(keyInfo, dispatch, getState)
  .then(wallet => {
    // Turn the wallet on
    WALLET_API.activateWalletRequest(wallet)
    return Promise.resolve(wallet)
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

    dispatch(WALLET_ACTIONS.updateWalletComplete(keyInfo.id))
    // Add the wallet to Redux Core
    wallet.archived = keyInfo.archived
    wallet.deleted = keyInfo.deleted
    wallet.sortIndex = keyInfo.sortIndex
    dispatch(WALLET_ACTIONS.addWallet(wallet))
    // Destructure the wallet and add it to Redux UI
    dispatch(UI_ACTIONS.activateWalletRequest(wallet))
  })
}

const archiveWallet = (keyInfo, dispatch, getState) => {
  dispatch(WALLET_ACTIONS.updateWalletStart(keyInfo.id))
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
    dispatch(WALLET_ACTIONS.updateWalletComplete(keyInfo.id))

    // Destructure the wallet and add it to Redux UI
    dispatch(UI_ACTIONS.archiveWalletRequest(wallet))
  })
}

const reorderWallet = (keyInfo, dispatch, getState) => {
  const state = getState()
  const wallet = state.core.wallets.byId[keyInfo.id]

  dispatch(UI_ACTIONS.upsertWallet(wallet))
}

const deleteWallet = (keyInfo, dispatch) => {
  // Remove the wallet from Redux Core
  // Remove the wallet from Redux UI
  dispatch(deleteWallet(keyInfo.id))
}

const isPending = (keyInfo, getState) => {
  const state = getState()
  const { pendingWalletIds } = state.core.wallets
  const isPending = pendingWalletIds.includes(keyInfo.id)

  return isPending
}
const shouldActivate = (keyInfo, getState) => {
  const state = getState()
  const wallet = state.core.wallets.byId[keyInfo.id]
  const isNew = (!wallet)
  const isActivating = !isNew && (!keyInfo.archived && wallet.archived)
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
  const shouldReorder = (keyInfo.sortOrder !== wallet.sortOrder)

  return shouldReorder
}
const shouldDelete = (keyInfo, getState) => {
  const state = getState()
  const wallet = state.core.wallets.byId[keyInfo.id]
  const shouldDelete = (keyInfo.deleted && (!!wallet || wallet.archived))

  return shouldDelete
}

const hasChanged = (wallet, nextKeyInfo) => {
  return false
  console.log('wallet', wallet)
  console.log('nextKeyInfo', nextKeyInfo)
  console.log('wallet.archived', wallet.archived)
  console.log('nextKeyInfo.archived', nextKeyInfo.archived)
  const hasChanged = (
    wallet.archived === nextKeyInfo.archived &&
    wallet.sortOrder === nextKeyInfo.sortOrder &&
    wallet.deleted === nextKeyInfo.deleted
  )

  return hasChanged
}
