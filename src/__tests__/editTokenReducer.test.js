/* eslint-disable flowtype/require-valid-file-annotation */

/* globals test expect */

import { editToken as editTokenReducer } from '../reducers/EditTokenReducer.js'

test('initialState', () => {
  const expected = {
    editCustomTokenProcessing: false
  }
  const actual = editTokenReducer(undefined, {})

  expect(actual).toEqual(expected)
})
