// @flow

import { expect, test } from '@jest/globals'

import { transactionList as transactionListReducer } from '../reducers/scenes/TransactionListReducer.js'

const dummyAction = { type: 'DUMMY_ACTION_PLEASE_IGNORE' }

test('initialState', () => {
  const expected = {
    transactions: [],
    transactionIdMap: {},
    currentCurrencyCode: '',
    currentEndIndex: 0,
    numTransactions: 0,
    currentWalletId: ''
  }
  const actual = transactionListReducer(undefined, dummyAction)

  expect(actual).toEqual(expected)
})
