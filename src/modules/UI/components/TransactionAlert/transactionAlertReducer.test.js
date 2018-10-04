// @flow

/* globals test expect */

import { transactionAlert } from './reducer.js'

const dummyAction = { type: 'DUMMY_ACTION_PLEASE_IGNORE' }

test('initialState', () => {
  const expected = {
    edgeTransaction: null,
    displayAlert: false
  }
  const actual = transactionAlert(undefined, dummyAction)

  expect(actual).toEqual(expected)
})
