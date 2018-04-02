/* eslint-disable flowtype/require-valid-file-annotation */

/* globals test expect */

import { walletListModal as walletListModalReducer } from './reducer.js'

test('initialState', () => {
  const expected = {
    walletListModalVisible: false
  }
  const actual = walletListModalReducer(undefined, {})

  expect(actual).toEqual(expected)
})
