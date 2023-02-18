import { gte } from 'biggystring'
import { EdgeGetTransactionsOptions, EdgeTransaction } from 'edge-core-js'

import { showTransactionDropdown } from '../components/navigation/TransactionDropdown'
import { showError } from '../components/services/AirshipInstance'
import { getExchangeDenomination } from '../selectors/DenominationSelectors'
import { Dispatch, RootState, ThunkAction } from '../types/reduxTypes'
import { NavigationBase } from '../types/routerTypes'
import { TransactionListTx } from '../types/types'
import { calculateSpamThreshold, isReceivedTransaction, unixToLocaleDateTime, zeroString } from '../util/utils'
import { checkFioObtData } from './FioActions'

export const updateBalance = () => ({
  type: 'noop'
})

export const CHANGED_TRANSACTIONS = 'UI/SCENES/TRANSACTION_LIST/CHANGED_TRANSACTIONS'
export const SUBSEQUENT_TRANSACTION_BATCH_QUANTITY = 30
export const INITIAL_TRANSACTION_BATCH_QUANTITY = 10

export function fetchMoreTransactions(walletId: string, currencyCode: string, reset: boolean): ThunkAction<void> {
  return (dispatch, getState) => {
    const state: RootState = getState()
    const { currentWalletId, currentCurrencyCode, numTransactions } = state.ui.scenes.transactionList
    let { currentEndIndex } = state.ui.scenes.transactionList
    const { transactions } = state.ui.scenes.transactionList
    let existingTransactions = transactions
    const walletTransactionsCount = numTransactions
    // if we are resetting then start over
    if (reset || (currentWalletId !== '' && currentWalletId !== walletId) || (currentCurrencyCode !== '' && currentCurrencyCode !== currencyCode)) {
      currentEndIndex = 0
      existingTransactions = []
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
        // @ts-expect-error
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
}

const getAndMergeTransactions = async (state: RootState, dispatch: Dispatch, walletId: string, currencyCode: string, options: EdgeGetTransactionsOptions) => {
  const { currencyWallets } = state.core.account
  const wallet = currencyWallets[walletId]
  if (!wallet) return
  // initialize the master array of transactions that will eventually go into Redux
  let transactionsWithKeys: TransactionListTx[] = [] // array of transactions as objects with key included for sorting?
  let transactionIdMap: { [txid: string]: boolean } = {} // maps id to sort order(?)
  // assume counter starts at zero (eg this is the first fetch)
  // if there are any options and the starting index is non-zero (eg this is a subsequent fetch)
  // @ts-expect-error
  if (options && options.startIndex > 0) {
    // then insert the already-loaded transactions into the master array of transactions
    transactionsWithKeys = [...state.ui.scenes.transactionList.transactions] // start off with previous values included
    transactionIdMap = { ...state.ui.scenes.transactionList.transactionIdMap }
  }
  try {
    const numTransactions = await wallet.getNumTransactions({ currencyCode }) // get number of transactions on wallet
    const transactions = await wallet.getTransactions({ ...options, currencyCode }) // get transactions from certain range

    for (const tx of transactions) {
      // for each transaction, add some meta info
      const { date, time } = unixToLocaleDateTime(tx.date)
      if (!transactionIdMap[tx.txid]) {
        // if the transaction is not already in the list
        transactionIdMap[tx.txid] = true
        // @ts-expect-error
        transactionsWithKeys.push({
          // then add it
          ...tx,
          dateString: date,
          time
        })
      }
    }
    const transactionCount = transactionsWithKeys.length
    let lastUnfilteredIndex = 0
    if (transactionCount) {
      // @ts-expect-error
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
  } catch (error: any) {
    showError(error)
  }
}

export function refreshTransactionsRequest(walletId: string, transactions: EdgeTransaction[]): ThunkAction<void> {
  return (dispatch, getState) => {
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
}

export function newTransactionsRequest(navigation: NavigationBase, walletId: string, edgeTransactions: EdgeTransaction[]): ThunkAction<void> {
  return (dispatch, getState) => {
    const edgeTransaction: EdgeTransaction = edgeTransactions[0]
    const state = getState()
    const wallet = state.core.account.currencyWallets[walletId]
    const exchangeRate = state.exchangeRates[`${edgeTransaction.currencyCode}_${wallet.fiatCurrencyCode}`]
    const currentViewableTransactions = state.ui.scenes.transactionList.transactions
    const selectedWalletId = state.ui.wallets.selectedWalletId
    const selectedCurrencyCode = state.ui.wallets.selectedCurrencyCode
    const spamFilterOn = state.ui.settings.spamFilterOn
    const exchangeDenom = getExchangeDenomination(state, wallet.currencyInfo.pluginId, edgeTransaction.currencyCode)
    let numberOfRelevantTransactions = 0
    let isTransactionForSelectedWallet = false
    const receivedTxs: EdgeTransaction[] = []
    for (const transaction of edgeTransactions) {
      if (isReceivedTransaction(transaction)) {
        receivedTxs.push(transaction)
      }
      if (transaction.currencyCode === selectedCurrencyCode && transaction.walletId === selectedWalletId) {
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
    if (spamFilterOn && !zeroString(exchangeRate) && gte(edgeTransaction.nativeAmount, calculateSpamThreshold(exchangeRate, exchangeDenom))) {
      showTransactionDropdown(navigation, edgeTransaction)
    }
  }
}

export function fetchTransactions(
  walletId: string,
  currencyCode: string,
  options?: {
    startIndex: number
    startEntries: number
  }
): ThunkAction<void> {
  return (dispatch, getState) => {
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
}
