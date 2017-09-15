export const PREFIX = 'UI/Wallets/'

export const UPSERT_WALLET = PREFIX + 'UPSERT_WALLET'

export const ACTIVATE_WALLET_ID = PREFIX + 'ACTIVATE_WALLET_ID'
export const ARCHIVE_WALLET_ID = PREFIX + 'ARCHIVE_WALLET_ID'

export const SELECT_WALLET_ID = PREFIX + 'SELECT_WALLET_ID'
export const SELECT_CURRENCY_CODE = PREFIX + 'SELECT_CURRENCY_CODE'

import * as UI_SELECTORS from '../selectors.js'
import * as CORE_SELECTORS from '../../Core/selectors.js'
import * as SETTINGS_SELECTORS from '../Settings/selectors'

export const selectWallet = (walletId, currencyCode) =>
  (dispatch) => {
    dispatch(selectWalletId(walletId))
    dispatch(selectCurrencyCode(currencyCode))
  }

export const selectWalletIdRequest = (walletId) => (dispatch, getState) => {
  const state = getState()
  const selectedWalletId = UI_SELECTORS.getSelectedWalletId(state)

  if (!selectedWalletId) {
    dispatch(selectWalletId(walletId))
  }
}

export const selectWalletId = (walletId) => ({
  type: SELECT_WALLET_ID,
  data: {walletId}
})

export const selectCurrencyCode = (currencyCode) => ({
  type: SELECT_CURRENCY_CODE,
  data: {currencyCode}
})

export const refreshWallet = (walletId) =>
  // console.log('refreshWallet')
   (dispatch, getState) => {
     const state = getState()
     const wallet = CORE_SELECTORS.getWallet(state, walletId)

     if (wallet) {
      // console.log('updating wallet balance', walletId)
       return dispatch(upsertWallet(wallet))
     }
    // console.log('wallet doesn\'t exist yet', walletId)
   }

export const upsertWallet = (wallet) => (dispatch, getState) => {
  const state = getState()
  const loginStatus = SETTINGS_SELECTORS.getLoginStatus(state)
  if (!loginStatus) {
    return {
      type: 'LOGGED_OUT'
    }
  }

  return {
    type: UPSERT_WALLET,
    data: {wallet}
  }
}
