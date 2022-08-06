// @flow

import type { EdgeTransaction } from 'edge-core-js'

import { showTransactionDropdown } from '../components/navigation/TransactionDropdown.js'
import { showError } from '../components/services/AirshipInstance.js'
import { type Dispatch, type GetState, type RootState } from '../types/reduxTypes.js'
import { type TransactionListTx } from '../types/types.js'
import { isReceivedTransaction, unixToLocaleDateTime } from '../util/utils'
import { checkFioObtData } from './FioActions'

export const updateBalance = () => ({
  type: 'noop'
})

export const CHANGED_TRANSACTIONS = 'UI/SCENES/TRANSACTION_LIST/CHANGED_TRANSACTIONS'
export const SUBSEQUENT_TRANSACTION_BATCH_QUANTITY = 30
export const INITIAL_TRANSACTION_BATCH_QUANTITY = 10

const emptyArray = []

export const fetchMoreTransactions = (walletId: string, currencyCode: string, reset: boolean) => (dispatch: Dispatch, getState: GetState) => {
  const state: RootState = getState()
  const { currentWalletId, currentCurrencyCode, numTransactions } = state.ui.scenes.transactionList
  let { currentEndIndex } = state.ui.scenes.transactionList
  const { transactions } = state.ui.scenes.transactionList
  let existingTransactions = transactions
  const walletTransactionsCount = numTransactions
  // if we are resetting then start over
  if (reset || (currentWalletId !== '' && currentWalletId !== walletId) || (currentCurrencyCode !== '' && currentCurrencyCode !== currencyCode)) {
    currentEndIndex = 0
    existingTransactions = emptyArray
  }

  // new batch will start with the first index after previous end index
  const nextStartIndex = currentEndIndex ? currentEndIndex + 1 : 0
  let nextEndIndex = currentEndIndex // start off with nextEndIndex equal to previous endIndex, will add range

  // set number of transactions in our existingTransactions array
  const existingTransactionsCount = existingTransactions.length
  if (!existingTransactionsCount) {
    // if there are no transactions yet
    nextEndIndex = INITIAL_TRANSACTION_BATCH_QUANTITY - 1 // then the ending index will be batch quantity minus one
  } else if (existingTransactionsCount < walletTransactionsCount) {
    // if we haven't gotten all of the transactions yet
    nextEndIndex += SUBSEQUENT_TRANSACTION_BATCH_QUANTITY // then the next batch end index will be the addition of the batch quantity
    if (nextEndIndex >= walletTransactionsCount) {
      // if you're at the end
      nextEndIndex = undefined // then don't worry about getting anything more
    }
  }

  if (
    nextEndIndex !== currentEndIndex || // if there are more tx to fetch
    (currentWalletId !== '' && currentWalletId !== walletId) || // if the wallet has change
    (currentCurrencyCode !== '' && currentCurrencyCode !== currencyCode) // maybe you've switched to a token wallet
  ) {
    let startEntries
    if (nextEndIndex) {
      startEntries = nextEndIndex - nextStartIndex + 1
    }
    // If startEntries is undefined / null, this means query until the end of the transaction list
    getAndMergeTransactions(state, dispatch, walletId, currencyCode, {
      startEntries,
      startIndex: nextStartIndex
    })
  }
}

const getAndMergeTransactions = async (state: RootState, dispatch: Dispatch, walletId: string, currencyCode: string, options: Object) => {
  const { currencyWallets } = state.core.account
  const wallet = currencyWallets[walletId]
  if (!wallet) return
  // initialize the master array of transactions that will eventually go into Redux
  let transactionsWithKeys: TransactionListTx[] = [] // array of transactions as objects with key included for sorting?
  let transactionIdMap = {} // maps id to sort order(?)
  // assume counter starts at zero (eg this is the first fetch)
  let key = 0
  // if there are any options and the starting index is non-zero (eg this is a subsequent fetch)
  if (options && options.startIndex > 0) {
    // then insert the already-loaded transactions into the master array of transactions
    transactionsWithKeys = [...state.ui.scenes.transactionList.transactions] // start off with previous values included
    transactionIdMap = { ...state.ui.scenes.transactionList.transactionIdMap }
    key = transactionsWithKeys.length // and fast forward the counter
  }
  try {
    const numTransactions = await wallet.getNumTransactions({ currencyCode }) // get number of transactions on wallet
    const transactions = await wallet.getTransactions({ ...options, currencyCode }) // get transactions from certain range

    for (const tx of transactions) {
      // for each transaction, add some meta info
      const { date, time } = unixToLocaleDateTime(tx.date)
      if (!transactionIdMap[tx.txid]) {
        // if the transaction is not already in the list
        transactionIdMap[tx.txid] = key
        // $FlowFixMe
        transactionsWithKeys.push({
          // then add it
          ...tx,
          dateString: date,
          time,
          key
        })
        key++
      }
    }
    const transactionCount = transactionsWithKeys.length
    let lastUnfilteredIndex = 0
    if (transactionCount) {
      // $FlowFixMe
      lastUnfilteredIndex = transactionsWithKeys[transactionCount - 1].otherParams.unfilteredIndex
    }
    dispatch({
      type: 'UI/SCENES/TRANSACTION_LIST/UPDATE_TRANSACTIONS',
      data: {
        numTransactions,
        transactionIdMap,
        transactions: transactionsWithKeys,
        currentCurrencyCode: currencyCode,
        currentWalletId: walletId,
        currentEndIndex: lastUnfilteredIndex
      }
    })
  } catch (error) {
    showError(error)
  }
}

export const refreshTransactionsRequest = (walletId: string, transactions: EdgeTransaction[]) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const selectedWalletId = state.ui.wallets.selectedWalletId
  const selectedCurrencyCode = state.ui.wallets.selectedCurrencyCode
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

export const newTransactionsRequest = (walletId: string, edgeTransactions: EdgeTransaction[]) => (dispatch: Dispatch, getState: GetState) => {
  const edgeTransaction: EdgeTransaction = edgeTransactions[0]
  const state = getState()
  const currentViewableTransactions = state.ui.scenes.transactionList.transactions
  const selectedWalletId = state.ui.wallets.selectedWalletId
  const selectedCurrencyCode = state.ui.wallets.selectedCurrencyCode

  let numberOfRelevantTransactions = 0
  let isTransactionForSelectedWallet = false
  const receivedTxs = []
  for (const transaction of edgeTransactions) {
    if (isReceivedTransaction(transaction)) {
      receivedTxs.push(transaction)
    }
    if (transaction.currencyCode === selectedCurrencyCode && transaction.wallet && transaction.wallet.id === selectedWalletId) {
      isTransactionForSelectedWallet = true
      // this next part may be unnecessary
      const indexOfNewTransaction = currentViewableTransactions.findIndex(tx => tx.txid === transaction.txid)
      if (indexOfNewTransaction === -1) {
        numberOfRelevantTransactions++
      }
    }
  }
  const options = {
    startIndex: 0,
    startEntries: state.ui.scenes.transactionList.currentEndIndex + 1 + numberOfRelevantTransactions
  }
  if (isTransactionForSelectedWallet) dispatch(fetchTransactions(walletId, selectedCurrencyCode, options))
  if (receivedTxs.length) dispatch(checkFioObtData(walletId, receivedTxs))
  if (!isReceivedTransaction(edgeTransaction)) return
  showTransactionDropdown(edgeTransaction, walletId)
}

export const fetchTransactions = (walletId: string, currencyCode: string, options?: Object) => (dispatch: Dispatch, getState: GetState) => {
  const state: RootState = getState()
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
