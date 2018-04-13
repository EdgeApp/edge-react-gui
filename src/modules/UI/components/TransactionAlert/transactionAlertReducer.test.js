/* eslint-disable flowtype/require-valid-file-annotation */

/* globals test expect */

import { transactionAlert as transactionAlertReducer } from './reducer.js'

test('initialState', () => {
  const expected = {
    edgeTransaction: '',
    displayAlert: false
  }
  const actual = transactionAlertReducer(undefined, {})

  expect(actual).toEqual(expected)
})
