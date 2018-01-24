/* globals test expect */

import { transactionAlert as transactionAlertReducer } from './reducer.js'

test('initialState', () => {
  const expected = {
    abcTransaction: '',
    displayAlert: false
  }
  const actual = transactionAlertReducer(undefined, {})

  expect(actual).toEqual(expected)
})
