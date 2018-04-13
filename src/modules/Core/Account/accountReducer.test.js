/* eslint-disable flowtype/require-valid-file-annotation */

/* globals test expect */

import { account as accountReducer } from './reducer.js'

test('initialState', () => {
  const expected = {}
  const actual = accountReducer(undefined, {})

  expect(actual).toEqual(expected)
})
