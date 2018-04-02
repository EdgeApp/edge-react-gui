/* eslint-disable flowtype/require-valid-file-annotation */

/* globals test expect */

import { exchangeRate as exchangeRateReducer } from './reducer.js'

test('initialState', () => {
  const expected = {
    exchangeRates: {}
  }
  const actual = exchangeRateReducer(undefined, {})

  expect(actual).toEqual(expected)
})
