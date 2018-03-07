// @flow
import type { AbcCurrencyWallet } from 'edge-core-js'

import type { Dispatch, GetState } from '../../ReduxTypes'
import * as SETTINGS_SELECTORS from '../../UI/Settings/selectors'
import * as CORE_SELECTORS from '../selectors'

export const PREFIX = 'Core/Wallets/'
export const UPDATE_WALLETS = PREFIX + 'UPDATE_WALLETS'

export const updateWallets = (activeWalletIds: Array<string>, archivedWalletIds: Array<string>, currencyWallets: { [id: string]: AbcCurrencyWallet }) => ({
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
  const { activeWalletIds, archivedWalletIds, currencyWallets } = account

  for (const walletId: string of Object.keys(currencyWallets)) {
    const abcWallet: AbcCurrencyWallet = currencyWallets[walletId]
    if (abcWallet.type === 'wallet:ethereum') {
      if (state.ui.wallets && state.ui.wallets.byId && state.ui.wallets.byId[walletId]) {
        const enabledTokens = state.ui.wallets.byId[walletId].enabledTokens
        abcWallet.enableTokens(enabledTokens)
      }
    }
  }

  return dispatch(updateWallets(activeWalletIds, archivedWalletIds, currencyWallets))
}
