/* eslint-disable flowtype/require-valid-file-annotation */

/* globals test expect */

import { editToken as editTokenReducer } from '../reducers/EditTokenReducer.js'

test('initialState', () => {
  const expected = {
    deleteCustomTokenProcessing: false,
    deleteTokenModalVisible: false,
    editCustomTokenProcessing: false
  }
  const actual = editTokenReducer(undefined, {})

  expect(actual).toEqual(expected)
})
