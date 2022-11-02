import { expect, test } from '@jest/globals'

import { transactionDetails as transactionDetailsReducer } from '../../reducers/scenes/TransactionDetailsReducer'

test('initialState', () => {
  const expected = {
    subcategories: []
  }
  const actual = transactionDetailsReducer(undefined, { type: 'DUMMY_ACTION_PLEASE_IGNORE' })

  expect(actual).toEqual(expected)
})
