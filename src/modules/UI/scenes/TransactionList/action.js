// @flow

import type { AbcTransaction } from 'edge-login'
import type { DateTransactionGroup } from '../../../../types.js'
import * as CORE_SELECTORS from '../../../Core/selectors.js'
import * as WALLET_API from '../../../Core/Wallets/api.js'
import type { Dispatch, GetState } from '../../../ReduxTypes'
import { Actions } from 'react-native-router-flux'
import * as UI_SELECTORS from '../../../UI/selectors.js'
import * as UTILS from '../../../utils'
import { displayTransactionAlert } from '../../components/TransactionAlert/actions'
import * as SCENE_KEYS from '../../../../constants/SceneKeys.js'
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

export const fetchTransactions = (walletId: string, currencyCode: string, options: Object = {}) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const wallet = CORE_SELECTORS.getWallet(state, walletId)
  if (wallet) {
    WALLET_API.getTransactions(wallet, currencyCode, options).then(transactions => {
      const correctedTransactionsOrder = transactions.reverse()
      const subArrayOfNewTransactions = correctedTransactionsOrder.slice(0, options.numEntries)
      const newGroupedTransactionsByDate = groupTransactionsByDate(subArrayOfNewTransactions)
      dispatch(updateTransactions(transactions, newGroupedTransactionsByDate))
    }).catch((e) => {
      console.warn('Issue with getTransactions: ', e.message)
    })
  }
}

export const refreshTransactionsRequest = (walletId: string, transactions: Array<AbcTransaction>) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const selectedWalletId = UI_SELECTORS.getSelectedWalletId(state)
  const currencyCode = UI_SELECTORS.getSelectedCurrencyCode(state)

  if ((walletId === selectedWalletId) && (Actions.currentScene === SCENE_KEYS.TRANSACTION_LIST)) {
    return dispatch(fetchTransactions(walletId, currencyCode))
  }
}

export const newTransactionsRequest = (walletId: string, abcTransactions: Array<AbcTransaction>) => (dispatch: Dispatch) => {
  const abcTransaction: AbcTransaction = abcTransactions[0]
  if (!UTILS.isReceivedTransaction(abcTransaction)) return

  dispatch(displayTransactionAlert(abcTransaction))
}

export const updateTransactions = (transactions: Array<AbcTransaction>, groupedTransactionsByDate: Array<DateTransactionGroup>) => ({
  type: UPDATE_TRANSACTIONS,
  data: { transactions, groupedTransactionsByDate }
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

export function groupTransactionsByDate (transactions: Array<AbcTransaction>) {
  const sectionedTransactionList = []
  let previousDateString: string = ''
  let currentSectionData = {title: '', data: []}
  transactions.map((x, i) => {
    const newValue: any = {...x}
    newValue.key = i
    const txDate = new Date(x.date * 1000)

    // let time = formatAMPM(txDate)
    // let dateString = monthNames[month] + ' ' + day + ', ' + year // will we need to change date format based on locale?
    const dateString = txDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
    const time = txDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric' })
    newValue.dateString = dateString
    newValue.time = time
    if (previousDateString === dateString) { // if it's still in the same date
      currentSectionData.data.push(newValue)
    } else { // if it is not the same date
      currentSectionData = {title: dateString, data: [newValue]}
      sectionedTransactionList.push(currentSectionData)
    }
    previousDateString = dateString
    return newValue
  })
  return sectionedTransactionList
}
