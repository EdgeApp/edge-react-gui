/* globals test expect */

import { wallets as walletsReducer } from './reducer.js'

test('initialState', () => {
  const expected = {
    activeWalletIds: [],
    addTokenPending: false,
    archivedWalletIds: [],
    byId: {},
    manageTokensPending: false,
    selectedCurrencyCode: '',
    selectedWalletId: ''
  }
  const actual = walletsReducer(undefined, {})

  expect(actual).toEqual(expected)
})
