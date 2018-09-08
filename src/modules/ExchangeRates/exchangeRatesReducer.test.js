/* eslint-disable flowtype/require-valid-file-annotation */

/* globals test expect */

import { exchangeRates } from './reducer.js'

test('initialState', () => {
  const expected = {}
  const actual = exchangeRates(undefined, {})

  expect(actual).toEqual(expected)
})
