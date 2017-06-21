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

    filteredSortedKeyInfos.forEach(keyInfo => {
      const wallet = state.ui.wallets.byId[keyInfo.id]
      processKeyInfo(keyInfo, wallet, dispatch, state, io, account)
    })
  }
}

const processKeyInfo = (keyInfo, wallet, dispatch, state, io, account) => {
  const walletStatus = getWalletStatus(keyInfo, wallet)

  if (walletStatus === 'same') { return }

  if (walletStatus === 'new' || walletStatus === 'activate') {
    // Instantiate a new wallet object
    WALLET_API.makeCurrencyWalletRequest(keyInfo, dispatch, io, account)
    .then(wallet => {
      // Turn the wallet on
      WALLET_API.activateWalletRequest(wallet)
    })
    .then(wallet => {
      // Add the wallet to Redux Core
      dispatch(WALLET_ACTIONS.addWallet(wallet))
      // Destructure the wallet and add it to Redux UI
      dispatch(UI_ACTIONS.activateWalletRequest(wallet))
    })
  }

  if (walletStatus === 'archive') {
    const wallet = state.core.wallets.byId[keyInfo.id]
    // Turn the wallet off
    WALLET_API.archiveWalletRequest(wallet)
    .then(() => {
      // Destructure the wallet and add it to Redux UI
      dispatch(UI_ACTIONS.archiveWalletRequest(wallet))
    })
  }

  if (walletStatus === 'reorder') {
    const wallet = state.core.wallets.byId[keyInfo.id]
    // Destructure the wallet and add it to Redux UI
    dispatch(UI_ACTIONS.addWallet(wallet))
  }
}

const getWalletStatus = (keyInfo, wallet) => {
  if (
    keyInfo.archived === wallet.archived &&
    keyInfo.sortIndex === wallet.sortIndex
  ) {
    return 'same'
  }

  if (!wallet) {
    return 'new'
  }

  if (!keyInfo.archived && wallet.archived) {
    return 'activate'
  }

  if (keyInfo.archived && !wallet.archived) {
    return 'archive'
  }

  if (keyInfo.sortIndex === wallet.sortIndex) {
    return 'reorder'
  }
}
