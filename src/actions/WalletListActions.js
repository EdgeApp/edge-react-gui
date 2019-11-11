// @flow

import { showError } from '../components/services/AirshipInstance.js'
import * as ACCOUNT_SETTINGS from '../modules/Core/Account/settings.js'
import * as CORE_SELECTORS from '../modules/Core/selectors.js'
import { setAccountBalanceVisibility } from '../modules/Settings/SettingsActions.js'
import type { Dispatch, GetState } from '../types/reduxTypes.js'

export const updateActiveWalletsOrder = (activeWalletIds: Array<string>) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { account } = state.core

  const newKeyStates = activeWalletIds.reduce((keyStates, id, index) => {
    keyStates[id] = { sortIndex: index }
    return keyStates
  }, {})

  return account.changeWalletStates(newKeyStates).catch(showError)
}

export const toggleAccountBalanceVisibility = () => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  const currentAccountBalanceVisibility = state.ui.settings.isAccountBalanceVisible
  ACCOUNT_SETTINGS.setAccountBalanceVisibility(account, !currentAccountBalanceVisibility)
    .then(() => {
      dispatch(setAccountBalanceVisibility(!currentAccountBalanceVisibility))
    })
    .catch(showError)
}

export const updateArchivedWalletsOrder = (archivedWalletIds: Array<string>) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { account } = state.core

  const newKeyStates = archivedWalletIds.reduce((keyStates, id, index) => {
    keyStates[id] = { sortIndex: index }
    return keyStates
  }, {})

  return account.changeWalletStates(newKeyStates).catch(error => console.log(error))
}
