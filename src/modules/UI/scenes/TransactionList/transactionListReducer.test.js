/* globals test expect */

import { transactionList as transactionListReducer } from './reducer.js'

test('initialState', () => {
  const expected = {
    searchVisible: false,
    transactions: [],
    transactionsWalletListModalVisibility: false,
    updatingBalance: true,
    loadingTransactions: false, // needs to be changed later
    visibleTransactions: [],
    currentEndIndex: 0
  }
  const actual = transactionListReducer(undefined, {})

  expect(actual).toEqual(expected)
})
