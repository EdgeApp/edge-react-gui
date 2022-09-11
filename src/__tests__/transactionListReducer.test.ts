/* globals test expect */

import { transactionList as transactionListReducer } from '../reducers/scenes/TransactionListReducer'

test('initialState', () => {
  const expected = {
    transactions: [],
    transactionIdMap: {},
    currentCurrencyCode: '',
    currentEndIndex: 0,
    numTransactions: 0,
    currentWalletId: ''
  }
  // @ts-expect-error
  const actual = transactionListReducer(undefined, {})

  expect(actual).toEqual(expected)
})
