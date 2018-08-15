// @flow

import * as ACCOUNT_API from '../../../Core/Account/api.js'
import * as ACCOUNT_SETTINGS from '../../../Core/Account/settings.js'
import * as CORE_SELECTORS from '../../../Core/selectors.js'
import type { Dispatch, GetState } from '../../../ReduxTypes'
import { setAccountBalanceVisibility, updateWalletFiatBalanceVisibility } from '../../Settings/action.js'

export const TOGGLE_ARCHIVE_VISIBILITY = 'TOGGLE_ARCHIVE_VISIBILITY'

export const UPDATE_ACTIVE_WALLETS_ORDER_START = 'UPDATE_ACTIVE_WALLETS_ORDER_START'
export const UPDATE_ACTIVE_WALLETS_ORDER_SUCCESS = 'UPDATE_ACTIVE_WALLETS_ORDER_SUCCESS'

export const UPDATE_ARCHIVED_WALLETS_ORDER_START = 'UPDATE_ARCHIVED_WALLETS_ORDER_START'
export const UPDATE_ARCHIVED_WALLETS_ORDER_SUCCESS = 'UPDATE_ARCHIVED_WALLETS_ORDER_SUCCESS'

export const ADD_TOKEN = 'ADD_TOKEN'

export const updateActiveWalletsOrder = (activeWalletIds: Array<string>) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { account } = state.core
  dispatch(wrap(UPDATE_ACTIVE_WALLETS_ORDER_START, { activeWalletIds }))
  ACCOUNT_API.updateActiveWalletsOrderRequest(account, activeWalletIds)
    .then(() => {
      dispatch(wrap(UPDATE_ACTIVE_WALLETS_ORDER_SUCCESS, { activeWalletIds }))
    })
    .catch(e => console.log(e))
}

export const toggleAccountBalanceVisibility = () => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  const currentAccountBalanceVisibility = state.ui.settings.isAccountBalanceVisible
  ACCOUNT_SETTINGS.setAccountBalanceVisibility(account, !currentAccountBalanceVisibility)
    .then(() => dispatch(setAccountBalanceVisibility(!currentAccountBalanceVisibility)))
    .catch(error => {
      console.error(error)
    })
}

export const toggleWalletFiatBalanceVisibility = () => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  const currentWalletFiatBalanceVisibility = state.ui.settings.isWalletFiatBalanceVisible
  ACCOUNT_SETTINGS.setWalletFiatBalanceVisibility(account, !currentWalletFiatBalanceVisibility)
    .then(() => dispatch(updateWalletFiatBalanceVisibility(!currentWalletFiatBalanceVisibility)))
    .catch(error => {
      console.error(error)
    })
}

export const updateArchivedWalletsOrder = (archivedWalletIds: Array<string>) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { account } = state.core

  dispatch(wrap(UPDATE_ARCHIVED_WALLETS_ORDER_START, { archivedWalletIds }))

  ACCOUNT_API.updateArchivedWalletsOrderRequest(account, archivedWalletIds)
    .then((archivedWalletIds: Array<string>) => {
      dispatch(wrap(UPDATE_ARCHIVED_WALLETS_ORDER_SUCCESS, { archivedWalletIds }))
    })
    .catch(e => console.log(e))
}

const wrap = (type, data) => ({ type, data })
