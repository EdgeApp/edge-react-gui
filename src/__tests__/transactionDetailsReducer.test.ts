/* globals test expect */

import { transactionDetails as transactionDetailsReducer } from '../reducers/scenes/TransactionDetailsReducer'

test('initialState', () => {
  const expected = {
    subcategories: []
  }
  // @ts-expect-error
  const actual = transactionDetailsReducer(undefined, {})

  expect(actual).toEqual(expected)
})
