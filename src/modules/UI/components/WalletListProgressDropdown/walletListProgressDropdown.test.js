// @flow

/* globals test expect */

import { walletListProgressDropdown as walletListProgressDropdownReducer } from './reducer.js'

test('initialState', () => {
  const expected = {
    displayDropdown: false
  }
  const actual = walletListProgressDropdownReducer(undefined, {})

  expect(actual).toEqual(expected)
})
