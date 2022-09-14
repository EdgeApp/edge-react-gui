/* eslint-disable flowtype/require-valid-file-annotation */

import { expect, test } from '@jest/globals'

import { transactionDetails as transactionDetailsReducer } from '../reducers/scenes/TransactionDetailsReducer.js'

test('initialState', () => {
  const expected = {
    subcategories: []
  }
  const actual = transactionDetailsReducer(undefined, {})

  expect(actual).toEqual(expected)
})
