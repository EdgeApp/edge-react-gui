/* eslint-disable flowtype/require-valid-file-annotation */

/* globals test expect */

import { helpModal as helpModalReducer } from './reducer.js'

test('initialState', () => {
  const expected = false
  const actual = helpModalReducer(undefined, {})

  expect(actual).toEqual(expected)
})
