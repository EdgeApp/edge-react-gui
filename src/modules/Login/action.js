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

export const addAccountToRedux = account => {
  return {
    type: ADD_ACCOUNT_TO_REDUX,
    data: { account }
  }
}

export const addWalletByKey = key => {
  return (dispatch, getState) => {
    const { id, archived } = key
    const account = getState().account
    const plugin = makeShitcoinPlugin({
      io: getState().account.io
    })
    const callbacks = makeWalletCallbacks(dispatch, getState, id)
    const opts = {
      account,
      plugin,
      callbacks
    }
    makeCurrencyWallet(key, opts)
    .then(wallet => {
      dispatch(addWallet(wallet))
      // if (!archived) { TODO: update with loading optimizations
      // else {}
      dispatch(activateWallet(wallet))
    })
  }
}

const activateWallet = wallet => {
  return (dispatch, getState) => {
    wallet.startEngine()
    .then(() => {
      dispatch(activateWalletId(wallet.id))
    })
  }
}

const activateWalletId = (id) => {
  return {
    type: ACTIVATE_WALLET_ID,
    data: {
      id
    }
  }
}

const archiveWallet = wallet => {
  wallet.stopEngine()
  return (dispatch, getState) => {
    dispatch(archiveWalletId(wallet.id))
  }
}

const archiveWalletId = (id) => {
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
    },

    onTransactionsChanged (transactions) {
      console.log('onTransactionsChanged', transactions)
      dispatch(updateTransactionsRequest(walletId, transactions))
    },

    onNewTransactions (transactions) {
      console.log('onNewTransaction', transactions)
      dispatch(updateTransactionsRequest(walletId, transactions))
    },

    onBlockHeightChanged (blockHeight) {
      console.log('onBlockHeightChanged', blockHeight)
      // dispatch(setBlockHeight(walletId, blockHeight))
    }
  }

  return callbacks
}
