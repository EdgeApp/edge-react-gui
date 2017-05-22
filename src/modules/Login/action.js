export const ADD_AIRBITZ_TO_REDUX = 'ADD_AIRBITZ_TO_REDUX'
export const SET_ACCOUNT_LOADING_STATUS = 'SET_ACCOUNT_LOADING_STATUS'
export const ADD_ACCOUNT_TO_REDUX = 'ADD_ACCOUNT_TO_REDUX'
export const ADD_WALLET_BY_KEY = 'ADD_WALLET_BY_KEY'
export const ADD_WALLET = 'ADD_WALLET'
export const ACTIVATE_WALLET = 'ACTIVATE_WALLET'
export const ACTIVATE_WALLET_ID = 'ACTIVATE_WALLET'
export const ARCHIVE_WALLET = 'ARCHIVE_WALLET'
export const ARCHIVE_WALLET_ID = 'ARCHIVE_WALLET'

import { makeShitcoinPlugin } from 'airbitz-txlib-shitcoin'
import { makeCurrencyWallet } from 'airbitz-core-js'

export const addAirbitzToRedux = airbitz => {
  return {
    type: ADD_AIRBITZ_TO_REDUX,
    airbitz
  }
}

export const setAccountLoadingStatus = (status) => {
  return {
    type: SET_ACCOUNT_LOADING_STATUS,
    data: {
      status
    }
  }
}

export const addAccountToRedux = account => {
  return {
    type: ADD_ACCOUNT_TO_REDUX,
    account
  }
}

export const addWalletByKey = key => {
  return (dispatch, getState) => {
    const { id, type, archived } = key
    const account = getState().account
    const plugin = makeShitcoinPlugin({
      io: getState().account.io
    })
    const callbacks = makeCallbacks(dispatch, id)
    const opts = {
      account,
      plugin,
      callbacks
    }
    makeCurrencyWallet(key, opts)
    .then(wallet => {
      if (!archived) {
        dispatch(activateWallet(wallet))
      } else {
        dispatch(archiveWallet(wallet))
      }

      console.log('wallet', wallet)
      return dispatch(addWallet(wallet))
    })
  }
}

const activateWallet = wallet => {
  wallet.startEngine()
  return (dispatch, getState) => {
    dispatch(activateWalletId(wallet.id))
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
    data: {
      wallet
    }
  }
}

const makeCallbacks = (dispatch, id) => {
  const callbacks = {
    onAddressesChecked (progressRatio) {
      console.log('onAddressesChecked', progressRatio)
    },

    onBalanceChanged (balance) {
      console.log('onBalanceChanged', balance)
      dispatch(setBalance(id, balance))
    },

    onTransactionsChanged (transactions) {
      console.log('onTransactionsChanged', transactions)
      dispatch(updateTransactions(id, transactions))
    },

    onNewTransactions (transactions) {
      console.log('onNewTransaction', transactions)
      dispatch(insertTransactions(id, transactions))
    },

    onBlockHeightChange (blockHeight) {
      console.log('onBlockHeightChanged', blockHeight)
      dispatch(setBlockHeight(id, blockHeight))
    }
  }

  return callbacks
}
