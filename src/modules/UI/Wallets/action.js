//@flow
export const PREFIX = 'UI/Wallets/'

export const UPSERT_WALLET = PREFIX + 'UPSERT_WALLET'

export const ACTIVATE_WALLET_ID = PREFIX + 'ACTIVATE_WALLET_ID'
export const ARCHIVE_WALLET_ID = PREFIX + 'ARCHIVE_WALLET_ID'

export const SELECT_WALLET_ID = PREFIX + 'SELECT_WALLET_ID'
export const SELECT_CURRENCY_CODE = PREFIX + 'SELECT_CURRENCY_CODE'

export const MANAGE_TOKENS = 'MANAGE_TOKEN'
export const MANAGE_TOKENS_START = 'MANAGE_TOKEN_START'
export const MANAGE_TOKENS_SUCCESS = 'MANAGE_TOKEN_SUCCESS'

import * as UI_SELECTORS from '../selectors.js'
import * as CORE_SELECTORS from '../../Core/selectors.js'
import * as SETTINGS_SELECTORS from '../Settings/selectors'
import {GuiWallet} from '../../../types'
import type {AbcCurrencyWallet} from 'airbitz-core-types'
import * as WALLET_API from '../../Core/Wallets/api.js'

export const selectWallet = (walletId: string, currencyCode: string) =>
  (dispatch: any) => {
    dispatch(selectWalletId(walletId))
    dispatch(selectCurrencyCode(currencyCode))
  }

export const selectWalletIdRequest = (walletId: string) => (dispatch: any, getState: any) => {
  const state = getState()
  const selectedWalletId = UI_SELECTORS.getSelectedWalletId(state)

  if (!selectedWalletId) {
    dispatch(selectWalletId(walletId))
  }
}

export const selectWalletId = (walletId: string) => ({
  type: SELECT_WALLET_ID,
  data: {walletId}
})

export const selectCurrencyCode = (currencyCode: string) => ({
  type: SELECT_CURRENCY_CODE,
  data: {currencyCode}
})

export const refreshWallet = (walletId: string) =>
  // console.log('refreshWallet')
  (dispatch: any, getState: any) => {
    const state = getState()
    const wallet = CORE_SELECTORS.getWallet(state, walletId)

    if (wallet) {
      // console.log('updating wallet balance', walletId)
      return dispatch(upsertWallet(wallet))
    }
    // console.log('wallet doesn\'t exist yet', walletId)
  }

export const upsertWallet = (wallet: AbcCurrencyWallet) => (dispatch: any, getState: any): ?GuiWallet => {
  const state = getState()
  const loginStatus = SETTINGS_SELECTORS.getLoginStatus(state)
  if (!loginStatus) {
    dispatch({
      type: 'LOGGED_OUT'
    })
  }

  dispatch({
    type: UPSERT_WALLET,
    data: {wallet}
  })
}

export const setEnabledTokens = (walletId: string, enabledTokens: any) => (dispatch: any, getState: any) => {
  dispatch(setTokensStart())
  const state = getState()
  const wallet = CORE_SELECTORS.getWallet(state, walletId)
  WALLET_API.setSyncedTokens(wallet, enabledTokens)
  .then((tokens) => {
    dispatch(setTokensSuccess())
    return tokens
  })
}

export const getEnabledTokens = (walletId: string) => (dispatch: any, getState: any) => {
  const state = getState()
  const wallet = CORE_SELECTORS.getWallet(state, walletId)
  WALLET_API.getSyncedTokens(wallet)
  .then((tokens) => {
    wallet.tokensEnabled = tokens
    dispatch(upsertWallet(wallet))
  })
}

export const getCoreEnabledTokens = (walletId: string) => (dispatch: any, getState: any) => {
  const state = getState()
  const wallet = CORE_SELECTORS.getWallet(state, walletId)
  WALLET_API.getCoreEnabledTokens(wallet)
  .then((enabledTokens) => {
    return enabledTokens
  })
  .catch((e) => {
    console.log('getCoreEnabledTokens error: ' , e)
  })
}

export const setTokensStart = () => ({
  type: MANAGE_TOKENS_START
})

export const setTokensSuccess = () => ({
  type: MANAGE_TOKENS_SUCCESS
})