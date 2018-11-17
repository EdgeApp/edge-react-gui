// @flow

/* globals test expect */

import { walletTransferList } from '../reducers/scenes/WalletTransferListReducer.js'

const dummyAction = { type: 'DUMMY_ACTION_PLEASE_IGNORE' }

test('initialState', () => {
  const expected = {
    walletListModalVisible: false,
    walletTransferList: []
  }
  const actual = walletTransferList(undefined, dummyAction)

  expect(actual).toEqual(expected)
})
