// @flow

import { expect, test } from '@jest/globals'

import { transactionDetails as transactionDetailsReducer } from '../reducers/scenes/TransactionDetailsReducer.js'

const dummyAction = { type: 'DUMMY_ACTION_PLEASE_IGNORE' }

test('initialState', () => {
  const expected = {
    subcategories: []
  }
  const actual = transactionDetailsReducer(undefined, dummyAction)

  expect(actual).toEqual(expected)
})
