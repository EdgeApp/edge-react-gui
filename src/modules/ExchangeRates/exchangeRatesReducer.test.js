// @flow

/* globals test expect */

import { exchangeRates } from './reducer.js'

const dummyAction = { type: 'DUMMY_ACTION_PLEASE_IGNORE' }

test('initialState', () => {
  const expected = {}
  const actual = exchangeRates(undefined, dummyAction)

  expect(actual).toEqual(expected)
})
