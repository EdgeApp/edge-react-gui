// @flow
import type {AbcCurrencyWallet} from 'airbitz-core-types'
import type {Dispatch, GetState} from '../../ReduxTypes'

export const PREFIX = 'Core/Wallets/'
export const UPDATE_WALLETS = PREFIX + 'UPDATE_WALLETS'

import * as CORE_SELECTORS from '../selectors'
import * as SETTINGS_SELECTORS from '../../UI/Settings/selectors'

export const updateWallets = (
  activeWalletIds: Array<string>,
  archivedWalletIds: Array<string>,
  currencyWallets: Array<AbcCurrencyWallet>) => ({
    type: UPDATE_WALLETS,
    data: {
      activeWalletIds,
      archivedWalletIds,
      currencyWallets
    }
  })

export const updateWalletsRequest = () => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const loginStatus = SETTINGS_SELECTORS.getLoginStatus(state)
  if (!loginStatus) {
    return {
      type: 'LOGGED_OUT'
    }
  }

  const account = CORE_SELECTORS.getAccount(state)
  const {activeWalletIds, archivedWalletIds, currencyWallets} = account

  for (const walletId:string of Object.keys(currencyWallets)) {
    const abcWallet:AbcCurrencyWallet = currencyWallets[walletId]
    if (abcWallet.type === 'wallet:ethereum') {
      abcWallet.enableTokens(['WINGS', 'REP'])
    }
  }

  return dispatch(updateWallets(activeWalletIds, archivedWalletIds, currencyWallets))
}
