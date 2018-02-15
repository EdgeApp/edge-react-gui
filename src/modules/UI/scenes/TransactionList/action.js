// @flow

import type { AbcTransaction } from 'edge-login'

import * as CORE_SELECTORS from '../../../Core/selectors.js'
import * as WALLET_API from '../../../Core/Wallets/api.js'
import type { Dispatch, GetState } from '../../../ReduxTypes'
import * as UI_SELECTORS from '../../../UI/selectors.js'
import * as UTILS from '../../../utils'
import { displayTransactionAlert } from '../../components/TransactionAlert/actions'

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

export const getTransactionsRequest = (walletId: string, currencyCode) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const wallet = CORE_SELECTORS.getWallet(state, walletId)

  if (wallet) {
    WALLET_API.getTransactions(wallet, currencyCode).then(transactions => {
      dispatch(updateTransactions(transactions))
    })
  }
}

export const refreshTransactionsRequest = (walletId: string) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const selectedWalletId = UI_SELECTORS.getSelectedWalletId(state)
  const currencyCode = UI_SELECTORS.getSelectedCurrencyCode(state)

  if (walletId === selectedWalletId) {
    return dispatch(getTransactionsRequest(walletId, currencyCode))
  }
}

export const newTransactionsRequest = (walletId: string, abcTransactions: Array<AbcTransaction>) => (dispatch: Dispatch) => {
  const abcTransaction: AbcTransaction = abcTransactions[0]
  if (!UTILS.isReceivedTransaction(abcTransaction)) return

  dispatch(displayTransactionAlert(abcTransaction))
}

export const newTransactions = (transactions: Array<AbcTransaction>) => ({
  type: NEW_TRANSACTIONS,
  data: { transactions }
})

export const changedTransactionsRequest = (transactions: Array<AbcTransaction>, walletId: string) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const selectedWalletId = UI_SELECTORS.getSelectedWalletId(state)

  if (walletId === selectedWalletId) {
    return dispatch(changedTransactions(transactions))
  }
}

export const changedTransactions = (transactions: Array<AbcTransaction>) => ({
  type: CHANGED_TRANSACTIONS,
  data: { transactions }
})

export const updateTransactions = (transactions: Array<AbcTransaction>) => ({
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
