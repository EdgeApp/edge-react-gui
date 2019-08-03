// @flow

import * as ACCOUNT_API from '../modules/Core/Account/api.js'
import * as ACCOUNT_SETTINGS from '../modules/Core/Account/settings.js'
import * as CORE_SELECTORS from '../modules/Core/selectors.js'
import { setAccountBalanceVisibility, updateWalletFiatBalanceVisibility } from '../modules/Settings/SettingsActions.js'
import type { Dispatch, GetState } from '../types/reduxTypes.js'

export const updateActiveWalletsOrder = (activeWalletIds: Array<string>) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { account } = state.core
  ACCOUNT_API.updateActiveWalletsOrderRequest(account, activeWalletIds).catch(error => console.log(error))
}

export const toggleAccountBalanceVisibility = () => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  const currentAccountBalanceVisibility = state.ui.settings.isAccountBalanceVisible
  ACCOUNT_SETTINGS.setAccountBalanceVisibility(account, !currentAccountBalanceVisibility)
    .then(() => {
      dispatch(setAccountBalanceVisibility(!currentAccountBalanceVisibility))
    })
    .catch(error => console.error(error))
}

export const toggleWalletFiatBalanceVisibility = () => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  const currentWalletFiatBalanceVisibility = state.ui.settings.isWalletFiatBalanceVisible
  ACCOUNT_SETTINGS.setWalletFiatBalanceVisibility(account, !currentWalletFiatBalanceVisibility)
    .then(() => {
      dispatch(updateWalletFiatBalanceVisibility(!currentWalletFiatBalanceVisibility))
    })
    .catch(error => console.error(error))
}

export const updateArchivedWalletsOrder = (archivedWalletIds: Array<string>) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { account } = state.core

  ACCOUNT_API.updateArchivedWalletsOrderRequest(account, archivedWalletIds).catch(error => console.log(error))
}
