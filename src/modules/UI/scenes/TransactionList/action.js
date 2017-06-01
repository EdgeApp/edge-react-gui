export const UPDATE_TRANSACTIONS_LIST = 'UPDATE_TRANSACTIONS_LIST'
export const DELETE_TRANSACTIONS_LIST = 'DELETE_TRANSACTIONS_LIST'
export const TRANSACTIONS_SEARCH_VISIBLE = 'TRANSACTIONS_SEARCH_VISIBLE'
export const TRANSACTIONS_SEARCH_HIDDEN = 'TRANSACTIONS_SEARCH_HIDDEN'
export const UPDATE_CONTACTS_LIST = 'UPDATE_CONTACTS_LIST'
export const UPDATE_SEARCH_RESULTS = 'UPDATE_SEARCH_RESULTS'
export const ENABLE_UPDATING_BALANCE = 'ENABLE_UPDATING_BALANCE'
export const DISABLE_UPDATING_BALANCE = 'DISABLE_UPDATING_BALANCE'
export const TOGGLE_UPDATING_BALANCE = 'TOGGLE_UPDATING_BALANCE'
export const TOGGLE_TRANSACTIONS_WALLET_LIST_MODAL = 'TOGGLE_TRANSACTIONS_WALLET_LIST_MODAL'
export const UPDATE_TRANSACTIONS = 'UPDATE_TRANSACTIONS'

import { openTransactionAlert } from '../../components/TransactionAlert/action.js'

export const updateBalance = () => {
  return {
    type: 'noop'
  }
}

export const updateTransactionsRequest = (walletId, transactions) => {
  return (dispatch, getState) => {
    const state = getState()
    const { selectedWalletId } = state.ui.wallets

    console.log('selectedWalletId', selectedWalletId)
    console.log('walletId', walletId)

    if (selectedWalletId === walletId) {
      console.log('adding transactions for selectedWallet')
      dispatch(updateTransactions(transactions))
    } else {
      const message = 'New transactions received'
      dispatch(openTransactionAlert(message))
    }
  }
}

export const updateTransactions = transactions => {
  return {
    type: UPDATE_TRANSACTIONS,
    data: { transactions }
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
