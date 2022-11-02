import { expect, test } from '@jest/globals'

import { transactionList as transactionListReducer } from '../../reducers/scenes/TransactionListReducer'

test('initialState', () => {
  const expected = {
    transactions: [],
    transactionIdMap: {},
    currentCurrencyCode: '',
    currentEndIndex: 0,
    numTransactions: 0,
    currentWalletId: ''
  }
  const actual = transactionListReducer(undefined, { type: 'DUMMY_ACTION_PLEASE_IGNORE' })

  expect(actual).toEqual(expected)
})
