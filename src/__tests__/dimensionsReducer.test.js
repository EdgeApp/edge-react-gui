/* eslint-disable flowtype/require-valid-file-annotation */

/* globals test expect */

import { dimensions as dimensionsReducer } from '../reducers/DimensionsReducer.js'

test('initialState', () => {
  const expected = {
    keyboardHeight: 0
  }
  const actual = dimensionsReducer(undefined, {})

  expect(actual).toEqual(expected)
})
