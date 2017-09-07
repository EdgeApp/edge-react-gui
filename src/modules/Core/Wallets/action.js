export const PREFIX = 'Core/Wallets/'
export const UPDATE_WALLETS = PREFIX + 'UPDATE_WALLETS'

import * as CORE_SELECTORS from '../selectors'
import * as SETTINGS_SELECTORS from '../../UI/Settings/selectors'

export const updateWallets = (activeWalletIds, archivedWalletIds, currencyWallets) => {
  return {
    type: UPDATE_WALLETS,
    data: {
      activeWalletIds,
      archivedWalletIds,
      currencyWallets
    }
  }
}

export const updateWalletsRequest = () => {
  return (dispatch, getState) => {
    const state = getState()
    const loginStatus = SETTINGS_SELECTORS.getLoginStatus(state)
    if (!loginStatus) {
      return {
        type: 'LOGGED_OUT'
      }
    }

    const account = CORE_SELECTORS.getAccount(state)
    const { activeWalletIds, archivedWalletIds, currencyWallets } = account

    return dispatch(updateWallets(activeWalletIds, archivedWalletIds, currencyWallets))
  }
}
