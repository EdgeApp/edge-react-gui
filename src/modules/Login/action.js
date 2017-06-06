export const ADD_AIRBITZ_TO_REDUX = 'ADD_AIRBITZ_TO_REDUX'
export const SET_ACCOUNT_LOADING_STATUS = 'SET_ACCOUNT_LOADING_STATUS'
export const ADD_ACCOUNT_TO_REDUX = 'ADD_ACCOUNT_TO_REDUX'
export const ADD_WALLET_BY_KEY = 'ADD_WALLET_BY_KEY'
export const ADD_WALLET = 'ADD_WALLET'
export const ACTIVATE_WALLET = 'ACTIVATE_WALLET'
export const ACTIVATE_WALLET_ID = 'ACTIVATE_WALLET'
export const ARCHIVE_WALLET = 'ARCHIVE_WALLET'
export const ARCHIVE_WALLET_ID = 'ARCHIVE_WALLET'

import { makeShitcoinPlugin } from 'airbitz-currency-shitcoin'
import { makeCurrencyWallet } from 'airbitz-core-js'

import { updateTransactionsRequest } from '../UI/scenes/TransactionList/action.js'
import { selectWalletById } from '../UI/Wallets/action.js'

export const addAirbitzToRedux = airbitz => {
  return {
    type: ADD_AIRBITZ_TO_REDUX,
    data: { airbitz }
  }
}

export const setAccountLoadingStatus = (status) => {
  return {
    type: SET_ACCOUNT_LOADING_STATUS,
    data: { status }
  }
}

export const refreshAccount = () => {
  return (dispatch, getState) => {
    const { byId } = getState().wallets

    console.log('getState().wallets', getState().wallets)
    console.log('getState().wallets.byId', getState().wallets.byId)

    Object.values(byId).forEach(wallet => {
      dispatch(addWallet(wallet))
    })
  }
}

export const refreshWallet = walletId => {
  return (dispatch, getState) => {
    const wallet = getState().wallets.byId[walletId]
    if (wallet) {
      dispatch(addWallet(wallet))
    }
  }
}

export const initializeAccount = account => {
  return dispatch => {
    dispatch(addAccountToRedux(account))
    const supportedTypes = [
      'wallet:shitcoin'
    ]
    let allKeys = account.allKeys

    const keys = allKeys.filter(key => {
      return supportedTypes.includes(key.type)
    })

    const firstWalletId = keys[0].id
    dispatch(addWalletsByKeys(keys))
    dispatch(selectWalletById(firstWalletId))
  }
}

export const addAccountToRedux = account => {
  return {
    type: ADD_ACCOUNT_TO_REDUX,
    data: { account }
  }
}

export const addWalletsByKeys = keys => {
  return dispatch => {
    keys.forEach(key => {
      dispatch(addWalletByKey(key))
    })
  }
}

export const addWalletByKey = key => {
  return (dispatch, getState) => {
    const { id, archived } = key
    const { account, airbitz: { io } } = getState()
    const plugin = makeShitcoinPlugin({ io })
    const callbacks = makeWalletCallbacks(dispatch, getState, id)
    const opts = {
      account,
      plugin,
      callbacks,
      io
    }
    // TODO: If the wallet is archived, don't even bother coming here
    makeCurrencyWallet(key, opts)
    .then(wallet => {
      wallet.startEngine()
      .then(() => {
        dispatch(addWallet(wallet))
        dispatch(activateWalletId(wallet.id))
      })
    })
  }
}

const activateWalletId = id => {
  return {
    type: ACTIVATE_WALLET_ID,
    data: { id }
  }
}

const archiveWallet = wallet => {
  wallet.stopEngine()
  return (dispatch, getState) => {
    dispatch(archiveWalletId(wallet.id))
  }
}

const archiveWalletId = id => {
  return {
    type: ARCHIVE_WALLET_ID,
    data: {
      id
    }
  }
}

export const addWallet = wallet => {
  return {
    type: ADD_WALLET,
    data: { wallet }
  }
}

const makeWalletCallbacks = (dispatch, getState, walletId) => {
  const callbacks = {
    onAddressesChecked (progressRatio) {
      if (progressRatio === 1) {
        console.log('onAddressesChecked', progressRatio)
      }
    },

    onBalanceChanged (balance) {
      console.log('onBalanceChanged', balance)
      // dispatch(setBalance(walletId, balance))
      dispatch(refreshWallet(walletId))
    },

    onTransactionsChanged (transactions) {
      console.log('onTransactionsChanged', transactions)
      // dispatch(refreshWallet(walletId))
      dispatch(updateTransactionsRequest(walletId, transactions))
    },

    onNewTransactions (transactions) {
      console.log('onNewTransaction', transactions)
      // dispatch(refreshWallet(walletId))
      dispatch(updateTransactionsRequest(walletId, transactions))
    },

    onBlockHeightChanged (blockHeight) {
      console.log('onBlockHeightChanged', blockHeight)
      // dispatch(setBlockHeight(walletId, blockHeight))
    },

    onWalletNameChanged (newWalletName) {
      console.log('onWalletNameChanged', newWalletName)
      dispatch(refreshWallet(walletId))
    }
  }

  return callbacks
}
