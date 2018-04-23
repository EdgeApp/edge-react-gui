// @flow

import type { EdgeTransaction } from 'edge-core-js'

import type { TransactionListTx } from '../../../../types.js'
import * as CORE_SELECTORS from '../../../Core/selectors.js'
import * as WALLET_API from '../../../Core/Wallets/api.js'
import type { Dispatch, GetState } from '../../../ReduxTypes'
import * as UI_SELECTORS from '../../../UI/selectors.js'
import * as UTILS from '../../../utils'
import { displayTransactionAlert } from '../../components/TransactionAlert/actions'

// import type { TransactionListTx } from './TransactionList.ui.js'
const PREFIX = 'UI/Scenes/TransactionList/'
export const UPDATE_TRANSACTIONS_LIST = PREFIX + 'UPDATE_TRANSACTIONS_LIST'
export const DELETE_TRANSACTIONS_LIST = PREFIX + 'DELETE_TRANSACTIONS_LIST'
export const UPDATE_WALLET_TRANSACTIONS = PREFIX + 'UPDATE_WALLET_TRANSACTIONS'
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
export const START_TRANSACTIONS_LOADING = PREFIX + 'START_TRANSACTIONS_LOADING'
export const END_TRANSACTIONS_LOADING = PREFIX + 'END_TRANSACTIONS_LOADING'

export const CHANGED_TRANSACTIONS = PREFIX + 'CHANGED_TRANSACTIONS'
export const SUBSEQUENT_TRANSACTION_BATCH_NUMBER = 30

export const fetchTransactions = (walletId: string, currencyCode: string, options: Object = {}) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const wallet = CORE_SELECTORS.getWallet(state, walletId)
  if (wallet) {
    WALLET_API.getTransactions(wallet, currencyCode, options)
      .then(transactions => {
        let key = -1
        const transactionsWithKeys = transactions.map(tx => {
          const txDate = new Date(tx.date * 1000)
          const dateString = txDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
          const time = txDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric' })
          key++
          return {
            ...tx,
            dateString,
            time,
            key
          }
        })
        dispatch(updateTransactions(transactionsWithKeys))
      })
      .catch(e => {
        console.warn('Issue with getTransactions: ', e.message)
      })
  }
}

export const refreshTransactionsRequest = (walletId: string, transactions: Array<EdgeTransaction>) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const selectedWalletId = UI_SELECTORS.getSelectedWalletId(state)
  const selectedCurrencyCode = UI_SELECTORS.getSelectedCurrencyCode(state)
  let shouldFetch = false
  for (const transaction of transactions) {
    if (transaction.currencyCode === selectedCurrencyCode) {
      shouldFetch = true
      break
    }
  }
  // Check if this is the selected wallet and we are on the transaction list scene
  if (walletId === selectedWalletId && shouldFetch) {
    dispatch(fetchTransactions(walletId, selectedCurrencyCode))
  }
}

export const newTransactionsRequest = (walletId: string, edgeTransactions: Array<EdgeTransaction>) => (dispatch: Dispatch) => {
  const edgeTransaction: EdgeTransaction = edgeTransactions[0]
  if (!UTILS.isReceivedTransaction(edgeTransaction)) return

  dispatch(displayTransactionAlert(edgeTransaction))
}

export const updateTransactions = (transactions: Array<TransactionListTx>) => ({
  type: UPDATE_TRANSACTIONS,
  data: { transactions }
})

export const updateBalance = () => ({
  type: 'noop'
})

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

// $FlowFixMe
export function updateContactsList (data) {
  return {
    type: UPDATE_CONTACTS_LIST,
    data
  }
}

// $FlowFixMe
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
