//  @flow

/* globals describe test expect */

import { wallets } from '../reducers/scenes/WalletsReducer.js'

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
      walletLoadingProgress: {},
      fioWallets: []
    }
    const actual = wallets(undefined, dummyAction)

    expect(actual).toEqual(expected)
  })
})
