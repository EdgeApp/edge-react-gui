const PREFIX = 'UI/Scenes/TransactionList/'
export const UPDATE_TRANSACTIONS_LIST = PREFIX + 'UPDATE_TRANSACTIONS_LIST'
export const DELETE_TRANSACTIONS_LIST = PREFIX + 'DELETE_TRANSACTIONS_LIST'
export const TRANSACTIONS_SEARCH_VISIBLE = PREFIX + 'TRANSACTIONS_SEARCH_VISIBLE'
export const TRANSACTIONS_SEARCH_HIDDEN = PREFIX + 'TRANSACTIONS_SEARCH_HIDDEN'
export const UPDATE_CONTACTS_LIST = PREFIX + 'UPDATE_CONTACTS_LIST'
export const UPDATE_SEARCH_RESULTS = PREFIX + 'UPDATE_SEARCH_RESULTS'
export const ENABLE_UPDATING_BALANCE = PREFIX + 'ENABLE_UPDATING_BALANCE'
export const DISABLE_UPDATING_BALANCE = PREFIX + 'DISABLE_UPDATING_BALANCE'
export const TOGGLE_UPDATING_BALANCE = PREFIX + 'TOGGLE_UPDATING_BALANCE'
export const TOGGLE_TRANSACTIONS_WALLET_LIST_MODAL = PREFIX + 'TOGGLE_TRANSACTIONS_WALLET_LIST_MODAL'
export const UPDATE_TRANSACTIONS = PREFIX + 'UPDATE_TRANSACTIONS'
export const GET_TRANSACTIONS = PREFIX + 'GET_TRANSACTIONS'

export const NEW_TRANSACTIONS = PREFIX + 'NEW_TRANSACTIONS'
export const CHANGED_TRANSACTIONS = PREFIX + 'CHANGED_TRANSACTIONS'

// import { openTransactionAlert } from '../../components/TransactionAlert/action.js'
import * as CORE_SELECTORS from '../../../Core/selectors.js'
import * as UI_SELECTORS from '../../../UI/selectors.js'
import * as WALLET_API from '../../../Core/Wallets/api.js'

import Action from 'react-native-router-flux'
import { openABAlert } from '../../components/ABAlert/action.js'

export const getTransactionsRequest = (walletId, currencyCode) => {
  return (dispatch, getState) => {
    const state = getState()
    const wallet = CORE_SELECTORS.getWallet(state, walletId)

    WALLET_API.getTransactions(wallet, currencyCode)
    .then(transactions => {
      dispatch(updateTransactions(transactions))
    })
  }
}

export const refreshTransactionsRequest = (walletId) => {
  return (dispatch, getState) => {
    const state = getState()
    const selectedWalletId = UI_SELECTORS.getSelectedWalletId(state)
    const currencyCode = UI_SELECTORS.getSelectedCurrencyCode(state)

    if (walletId === selectedWalletId) {
      return dispatch(getTransactionsRequest(walletId, currencyCode))
    }
  }
}

export const newTransactionsRequest = (walletId, transactions) => {
  return (dispatch) => {
    const messageInfo = {
      title: 'Transaction Received',
      message: 'You have received a new transaction',
      buttons: [
        { text: 'View', onPress: () => Action.transactionDetails(transactions[0]) }
      ]
    }
    dispatch(openABAlert(messageInfo))
  }
}

export const newTransactions = (transactions) => {
  return {
    type: NEW_TRANSACTIONS,
    data: { transactions }
  }
}

export const changedTransactionsRequest = (transactions, walletId) => {
  return (dispatch, getState) => {
    const state = getState()
    const selectedWalletId = UI_SELECTORS.getSelectedWalletId(state)

    if (walletId === selectedWalletId) {
      return dispatch(changedTransactions(transactions))
    }
  }
}

export const changedTransactions = (transactions) => {
  return {
    type: CHANGED_TRANSACTIONS,
    data: { transactions }
  }
}

export const updateTransactions = transactions => {
  return {
    type: UPDATE_TRANSACTIONS,
    data: { transactions }
  }
}

export const updateBalance = () => {
  return {
    type: 'noop'
  }
}

export function deleteTransactionsList () {
  return {
    type: DELETE_TRANSACTIONS_LIST
  }
}

export function transactionsSearchVisible () {
  return {
    type: TRANSACTIONS_SEARCH_VISIBLE
  }
}

export function transactionsSearchHidden () {
  return {
    type: TRANSACTIONS_SEARCH_HIDDEN
  }
}

export function updateContactsList (data) {
  return {
    type: UPDATE_CONTACTS_LIST,
    data
  }
}

export function updateSearchResults (data) {
  return {
    type: UPDATE_SEARCH_RESULTS,
    data
  }
}

export function toggleTransactionsWalletListModal () {
  return {
    type: TOGGLE_TRANSACTIONS_WALLET_LIST_MODAL
  }
}

export function updatingBalance (data) {
  console.log('inside updatingBalance, data is: ', data)
  let type = [data] + '_UPDATING_BALANCE'
  return {
    type
  }
}
