/* eslint-disable flowtype/require-valid-file-annotation */

/* globals test expect */

import { walletTransferListReducer } from './reducer.js'

test('initialState', () => {
  const expected = {
    walletListModalVisible: false,
    walletTransferList: []
  }
  const actual = walletTransferListReducer(undefined, {})

  expect(actual).toEqual(expected)
})
