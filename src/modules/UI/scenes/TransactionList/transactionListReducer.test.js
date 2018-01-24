/* globals test expect */

import { transactionList as transactionListReducer } from './reducer.js'

test('initialState', () => {
  const expected = {
    contactsList: [],
    searchVisible: false,
    transactions: [],
    transactionsWalletListModalVisibility: false,
    updatingBalance: true
  }
  const actual = transactionListReducer(undefined, {})

  expect(actual).toEqual(expected)
})
