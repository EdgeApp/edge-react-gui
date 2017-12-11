//@flow
export const PREFIX = 'UI/Wallets/'

export const UPSERT_WALLET = PREFIX + 'UPSERT_WALLET'

export const ACTIVATE_WALLET_ID = PREFIX + 'ACTIVATE_WALLET_ID'
export const ARCHIVE_WALLET_ID = PREFIX + 'ARCHIVE_WALLET_ID'

export const SELECT_WALLET_ID = PREFIX + 'SELECT_WALLET_ID'
export const SELECT_CURRENCY_CODE = PREFIX + 'SELECT_CURRENCY_CODE'

export const MANAGE_TOKENS = 'MANAGE_TOKENS'
export const MANAGE_TOKENS_START = 'MANAGE_TOKENS_START'
export const MANAGE_TOKENS_SUCCESS = 'MANAGE_TOKENS_SUCCESS'

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

// adds to core and enables in core
export const addCustomToken = (walletId: string, tokenObj: any) => (dispatch: any, getState: any) => {
  const state = getState()
  const wallet = CORE_SELECTORS.getWallet(state, walletId)
  WALLET_API.addCoreCustomToken(wallet, tokenObj)
  .then(() => {
    return
  })
  .catch((e) => console.log(e))
}

export const setEnabledTokens = (walletId: string, enabledTokens: Array<string>, disableTokens: Array<string>) => (dispatch: any, getState: any) => {
  // tell Redux that we are updating the enabledTokens list
  dispatch(setTokensStart())
  // get a snapshot of the state
  const state = getState()
  // get a copy of the relevant core wallet
  const wallet = CORE_SELECTORS.getWallet(state, walletId)
  // now actually tell the wallet to enable the token(s) in the core and save to file
  WALLET_API.setEnabledTokens(wallet, enabledTokens, disableTokens)
  .then(() => {
    // let Redux know it was completed successfully
    dispatch(setTokensSuccess())
    // refresh the wallet in Redux
    dispatch(refreshWallet(walletId))
  })
  .catch((e) => console.log(e))
}

export const getEnabledTokens = (walletId: string) => (dispatch: any, getState: any) => {
  // get a snapshot of the state
  const state = getState()
  // get the AbcWallet
  const wallet = CORE_SELECTORS.getWallet(state, walletId)
  // get list of enabled / disbaled tokens frome file (not core)
  WALLET_API.getEnabledTokensFromFile(wallet)
  .then((tokens) => {
    // make copy of the wallet
    let modifiedWallet = wallet
    // reflect the new enabled tokens in that wallet copy
    modifiedWallet.enabledTokens = tokens
    // do the actual enabling of the tokens
    WALLET_API.enableTokens(modifiedWallet, tokens)
    .then(() => {
      // now reflect that change in Redux's version of the wallet
      dispatch(upsertWallet(modifiedWallet))
    })
  })
}

export const setTokensStart = () => ({
  type: MANAGE_TOKENS_START
})

export const setTokensSuccess = () => ({
  type: MANAGE_TOKENS_SUCCESS
})