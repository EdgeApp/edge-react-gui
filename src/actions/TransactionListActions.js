// @flow

import type { EdgeTransaction } from 'edge-core-js'
import _ from 'lodash'

import * as CORE_SELECTORS from '../modules/Core/selectors.js'
import * as WALLET_API from '../modules/Core/Wallets/api.js'
import type { Dispatch, GetState, State } from '../modules/ReduxTypes'
import { displayTransactionAlert } from '../modules/UI/components/TransactionAlert/actions'
import * as UI_SELECTORS from '../modules/UI/selectors.js'
import type { TransactionListTx } from '../types.js'
import * as UTILS from '../util/utils'

export const updateTransactions = (transactionUpdate: {
  numTransactions: number,
  transactions: Array<TransactionListTx>,
  transactionIdMap: { [txid: string]: TransactionListTx },
  currentCurrencyCode: string,
  currentWalletId: string,
  currentEndIndex: number
}) => ({
  type: 'UI/SCENES/TRANSACTION_LIST/UPDATE_TRANSACTIONS',
  data: transactionUpdate
})

export const updateBalance = () => ({
  type: 'noop'
})

export const deleteTransactionsList = () => ({
  type: 'UI/SCENES/TRANSACTION_LIST/DELETE_TRANSACTIONS_LIST'
})

export const transactionsSearchVisible = () => ({
  type: 'UI/SCENES/TRANSACTION_LIST/TRANSACTIONS_SEARCH_VISIBLE'
})

export const transactionsSearchHidden = () => ({
  type: 'UI/SCENES/TRANSACTION_LIST/TRANSACTIONS_SEARCH_HIDDEN'
})

export const updateSearchResults = (data: any) => ({
  type: 'UI/SCENES/TRANSACTION_LIST/UPDATE_SEARCH_RESULTS',
  data
})

export const CHANGED_TRANSACTIONS = 'UI/SCENES/TRANSACTION_LIST/CHANGED_TRANSACTIONS'
export const SUBSEQUENT_TRANSACTION_BATCH_NUMBER = 30
export const INITIAL_TRANSACTION_BATCH_NUMBER = 10

const emptyArray = []

export const fetchMoreTransactions = (walletId: string, currencyCode: string, reset: boolean) => (dispatch: Dispatch, getState: GetState) => {
  const state: State = getState()
  const { currentWalletId, currentCurrencyCode, numTransactions } = state.ui.scenes.transactionList
  let { currentEndIndex, transactions } = state.ui.scenes.transactionList

  if (reset || (currentWalletId !== '' && currentWalletId !== walletId) || (currentCurrencyCode !== '' && currentCurrencyCode !== currencyCode)) {
    currentEndIndex = 0
    transactions = emptyArray
  }

  const newStartIndex = currentEndIndex ? currentEndIndex + 1 : 0
  let newEndIndex = currentEndIndex

  const txLength = transactions.length
  if (!txLength) {
    newEndIndex = INITIAL_TRANSACTION_BATCH_NUMBER - 1
  } else if (txLength < numTransactions) {
    newEndIndex += SUBSEQUENT_TRANSACTION_BATCH_NUMBER
    if (newEndIndex >= numTransactions) {
      newEndIndex = undefined
    }
  }

  if (
    newEndIndex !== currentEndIndex ||
    (currentWalletId !== '' && currentWalletId !== walletId) ||
    (currentCurrencyCode !== '' && currentCurrencyCode !== currencyCode)
  ) {
    let startEntries
    if (newEndIndex) {
      startEntries = newEndIndex - newStartIndex + 1
    }
    // If startEntries is undefined, this means query until the end of the transaction list
    getAndMergeTransactions(state, dispatch, walletId, currencyCode, {
      startEntries,
      startIndex: newStartIndex
    })
  }
}

export const fetchTransactions = (walletId: string, currencyCode: string, options?: Object) => (dispatch: Dispatch, getState: GetState) => {
  const state: State = getState()
  let startEntries, startIndex
  if (options) {
    startEntries = options.startEntries || state.ui.scenes.transactionList.currentEndIndex + 1
    startIndex = options.startIndex || 0
  } else {
    startEntries = state.ui.scenes.transactionList.currentEndIndex + 1
    startIndex = 0
  }
  getAndMergeTransactions(state, dispatch, walletId, currencyCode, {
    startEntries,
    startIndex
  })
}

const getAndMergeTransactions = async (state: State, dispatch: Dispatch, walletId: string, currencyCode: string, options: Object) => {
  const wallet = CORE_SELECTORS.getWallet(state, walletId)
  if (wallet) {
    // initialize the master array of transactions that will eventually go into Redux
    let transactionsWithKeys = []
    let transactionIdMap = {}
    // assume counter starts at zero (eg this is the first fetch)
    let key = 0
    // if there are any options and the starting index is non-zero (eg this is a subsequent fetch)
    if (options && options.startIndex > 0) {
      // then insert the already-loaded transactions into the master array of transactions
      transactionsWithKeys = transactionsWithKeys.concat(state.ui.scenes.transactionList.transactions)
      transactionIdMap = Object.assign({}, state.ui.scenes.transactionList.transactionIdMap)
      // and fast forward the counter
      key = transactionsWithKeys.length
    }
    try {
      const numTransactions = await WALLET_API.getNumTransactions(wallet, currencyCode)
      const transactions = await WALLET_API.getTransactions(wallet, currencyCode, options)

      for (const tx of transactions) {
        const txDate = new Date(tx.date * 1000)
        const dateString = txDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
        const time = txDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric' })
        if (!transactionIdMap[tx.txid]) {
          transactionIdMap[tx.txid] = key
          transactionsWithKeys.push({
            ...tx,
            dateString,
            time,
            key
          })
          key++
        } else {
          console.log('Duplicate txid found')
        }
      }
      dispatch(
        updateTransactions({
          numTransactions,
          transactionIdMap,
          transactions: transactionsWithKeys,
          currentCurrencyCode: currencyCode,
          currentWalletId: walletId,
          currentEndIndex: key - 1
        })
      )
    } catch (e) {
      console.warn('Issue with getTransactions: ', e.message)
    }
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

export const newTransactionsRequest = (walletId: string, edgeTransactions: Array<EdgeTransaction>) => (dispatch: Dispatch, getState: GetState) => {
  const edgeTransaction: EdgeTransaction = edgeTransactions[0]
  const state = getState()
  const currentViewableTransactions = state.ui.scenes.transactionList.transactions
  const selectedWalletId = UI_SELECTORS.getSelectedWalletId(state)
  const selectedCurrencyCode = UI_SELECTORS.getSelectedCurrencyCode(state)
  let numberOfRelevantTransactions = 0
  for (const transaction of edgeTransactions) {
    if (transaction.currencyCode === selectedCurrencyCode && transaction.wallet && transaction.wallet.id === selectedWalletId) {
      // this next part may be unnecessary
      const indexOfNewTransaction = _.findIndex(currentViewableTransactions, tx => tx.txid === transaction.txid)
      if (indexOfNewTransaction === -1) {
        numberOfRelevantTransactions++
      }
    }
  }
  const options = {
    startIndex: 0,
    startEntries: state.ui.scenes.transactionList.currentEndIndex + 1 + numberOfRelevantTransactions
  }
  dispatch(fetchTransactions(walletId, selectedCurrencyCode, options))
  if (!UTILS.isReceivedTransaction(edgeTransaction)) return
  dispatch(displayTransactionAlert(edgeTransaction))
}
