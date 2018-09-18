// @flow

/* globals test expect */

import { createWallet as createWalletReducer } from './reducer.js'

test('initialState', () => {
  const expected = {
    isCreatingWallet: false
  }
  const actual = createWalletReducer(undefined, {})

  expect(actual).toEqual(expected)
})
