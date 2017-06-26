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

// import { openTransactionAlert } from '../../components/TransactionAlert/action.js'

import * as WALLET_API from '../../../Core/Wallets/api.js'

export const getTransactionsRequest = () => {
  return (dispatch, getState) => {
    const state = getState()
    const wallet = getSelectedWallet(state)

    WALLET_API.getTransactions(wallet)
    .then(transactions => {
      dispatch(updateTransactions(transactions))
    })
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

const getWallet = (walletId, getState) => {
  const state = getState()
  const wallet = state.core.wallets.byId[walletId]

  return wallet
}

const getSelectedWallet = state => {
  const { core: { wallets: { byId } }, ui: { wallets: { selectedWalletId } } } = state
  const selectedWallet = byId[selectedWalletId]

  return selectedWallet
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
