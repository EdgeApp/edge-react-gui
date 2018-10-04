//  @flow

/* globals describe test expect */

import { wallets } from './reducer.js'

const dummyAction = { type: 'DUMMY_ACTION_PLEASE_IGNORE' }

describe('WalletsReducer', () => {
  test('initialState', () => {
    const expected = {
      byId: {},
      activeWalletIds: [],
      archivedWalletIds: [],
      selectedWalletId: '',
      selectedCurrencyCode: '',
      manageTokensPending: false,
      addTokenPending: false,
      walletLoadingProgress: {}
    }
    const actual = wallets(undefined, dummyAction)

    expect(actual).toEqual(expected)
  })
})
