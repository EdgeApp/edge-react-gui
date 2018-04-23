/* eslint-disable flowtype/require-valid-file-annotation */

/* globals describe test expect */

import {
  activeWalletIds,
  addTokenPending,
  archivedWalletIds,
  byId,
  manageTokensPending,
  selectedCurrencyCode,
  selectedWalletId,
  walletLoadingProgress,
  wallets
} from './reducer.js'

describe('WalletsReducer', () => {
  test('initialState', () => {
    const expected = {
      byId: byId(undefined, {}),
      activeWalletIds: activeWalletIds(undefined, {}),
      archivedWalletIds: archivedWalletIds(undefined, {}),
      selectedWalletId: selectedWalletId(undefined, {}),
      selectedCurrencyCode: selectedCurrencyCode(undefined, {}),
      manageTokensPending: manageTokensPending(undefined, {}),
      addTokenPending: addTokenPending(undefined, {}),
      walletLoadingProgress: walletLoadingProgress(undefined, {})
    }
    const actual = wallets(undefined, {})

    expect(actual).toEqual(expected)
  })
})
